package app.credito.contrato;

import static app.credito.contrato.FinanceiroRepository.*;

import app.credito.calculo.Calculadora;
import app.credito.calculo.Calculadora.*;
import app.credito.cliente.ClienteService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContratoService {

  public record Criar(
    @NotBlank String clienteId,
    @NotNull @Valid Entrada simulacao
  ) {}

  public record Receber(
    @NotBlank String parcelaId,
    @NotNull
    @DecimalMin("0.01")
    @Digits(integer = 10, fraction = 2)
    BigDecimal valor,
    @NotNull LocalDate data,
    @Size(max = 80) String forma,
    @Size(max = 2000) String observacao,
    @NotBlank @Size(max = 150) String chave
  ) {}

  public record Estornar(@NotBlank @Size(max = 2000) String justificativa) {}

  public record Antecipar(
    @NotBlank String contratoId,
    @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal valor,
    @Min(1) @Max(600) Integer novoMes,
    @NotNull LocalDate data,
    @NotBlank @Size(max = 100) String chave
  ) {}

  public record Parcela(
    String id,
    int numero,
    LocalDate vencimento,
    BigDecimal principal,
    BigDecimal juros,
    BigDecimal previsto,
    BigDecimal recebido,
    BigDecimal multa,
    BigDecimal mora,
    BigDecimal saldo,
    BigDecimal principalPendente,
    BigDecimal jurosPendentes,
    String status
  ) {}

  public record Indicadores(
    BigDecimal original,
    BigDecimal previsto,
    BigDecimal principalDevido,
    BigDecimal jurosFuturos,
    BigDecimal encargos,
    BigDecimal recebido,
    BigDecimal atraso,
    BigDecimal saldo,
    long pagas,
    long pendentes
  ) {}

  public record Extrato(
    Map<String, Object> contrato,
    List<Parcela> parcelas,
    List<Map<String, Object>> pagamentos,
    List<Map<String, Object>> antecipacoes,
    Indicadores indicadores,
    String status,
    String emitidoEm
  ) {}

  private final FinanceiroRepository r;
  private final Calculadora calc;
  private final ClienteService clientes;

  public ContratoService(
    FinanceiroRepository r,
    Calculadora c,
    ClienteService clientes
  ) {
    this.r = r;
    calc = c;
    this.clientes = clientes;
  }

  public static LocalDate hoje() {
    return LocalDate.now(ZoneId.of("America/Sao_Paulo"));
  }

  public static BigDecimal valor(long cents) {
    return BigDecimal.valueOf(cents, 2);
  }

  public static long cents(BigDecimal v) {
    return v.movePointRight(2).longValueExact();
  }

  private static String uuid() {
    return UUID.randomUUID().toString();
  }

  private void historico(String id, String op, String detalhes) {
    r.jdbc().update(
      "INSERT INTO historico_operacoes VALUES (?,?,?,?,?)",
      uuid(),
      id,
      op,
      detalhes,
      Instant.now().toString()
    );
  }

  private void travar(String id) {
    r.jdbc().update(
      "UPDATE contratos SET versao=versao+1,atualizado_em=? WHERE id=?",
      Instant.now().toString(),
      id
    );
  }

  @Transactional
  public Extrato criar(Criar e) {
    clientes.obter(e.clienteId);
    Resultado s = calc.simular(e.simulacao);
    Entrada a = s.entrada();
    String id = uuid(),
      now = Instant.now().toString();
    r.jdbc().update(
      "INSERT INTO contratos(id,cliente_id,modalidade,principal_centavos,taxa,prazo,mes_quitacao,primeiro_vencimento,multa,mora,criado_em,atualizado_em) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      id,
      e.clienteId,
      a.modalidade().name(),
      cents(a.principal()),
      a.taxa().toPlainString(),
      s.prazo(),
      s.mesQuitacao(),
      a.primeiroVencimento().toString(),
      a.multa().toPlainString(),
      a.mora().toPlainString(),
      now,
      now
    );
    for (Linha p : s.parcelas())
      r.jdbc().update(
        "INSERT INTO parcelas(id,contrato_id,numero,vencimento,principal_centavos,juros_centavos) VALUES (?,?,?,?,?,?)",
        uuid(),
        id,
        p.numero(),
        p.vencimento().toString(),
        cents(p.principal()),
        cents(p.juros())
      );
    historico(id, "CONTRATO_CRIADO", "Contrato confirmado; cronograma gerado.");
    return extrato(id);
  }

  @Transactional(readOnly = true)
  public List<Extrato> listar(String cliente) {
    var rows =
      cliente == null
        ? r
            .jdbc()
            .queryForList("SELECT id FROM contratos ORDER BY criado_em DESC")
        : r
            .jdbc()
            .queryForList(
              "SELECT id FROM contratos WHERE cliente_id=? ORDER BY criado_em DESC",
              cliente
            );
    return rows
      .stream()
      .map(x -> extrato(texto(x, "id")))
      .toList();
  }

  // Replay chronological allocations; the accrued charge balance is never written by a read.
  private record Saldo(
    long principal,
    long juros,
    long multa,
    long mora,
    long recebido
  ) {}

  private Saldo saldo(
    Map<String, Object> c,
    Map<String, Object> p,
    LocalDate data
  ) {
    long principal = numero(p, "principal_centavos"),
      juros = numero(p, "juros_centavos"),
      recebido = 0,
      multaPaga = 0,
      moraPaga = 0;
    LocalDate venc = LocalDate.parse(texto(p, "vencimento")),
      cursor = venc;
    BigDecimal acumulada = BigDecimal.ZERO;
    long multa = 0;
    boolean aplicada = false;
    for (var pg : r.pagamentos(texto(p, "id"))) {
      LocalDate dia = LocalDate.parse(texto(pg, "data_efetiva"));
      if (dia.isAfter(data)) continue;
      if (dia.isAfter(venc) && principal + juros > 0) {
        if (!aplicada) {
          multa = encargo(principal + juros, texto(c, "multa"), 1);
          aplicada = true;
        }
        long dias = Math.max(0, ChronoUnit.DAYS.between(cursor, dia));
        acumulada = acumulada.add(
          encargoExato(principal + juros, texto(c, "mora"), dias)
        );
      }
      if (dia.isAfter(cursor)) cursor = dia;
      principal -= numero(pg, "principal_centavos");
      juros -= numero(pg, "juros_centavos");
      multaPaga += numero(pg, "multa_centavos");
      moraPaga += numero(pg, "mora_centavos");
      recebido += numero(pg, "valor_centavos");
    }
    if (data.isAfter(venc) && principal + juros > 0) {
      if (!aplicada) multa = encargo(principal + juros, texto(c, "multa"), 1);
      acumulada = acumulada.add(
        encargoExato(
          principal + juros,
          texto(c, "mora"),
          Math.max(0, ChronoUnit.DAYS.between(cursor, data))
        )
      );
    }
    return new Saldo(
      principal,
      juros,
      Math.max(0, multa - multaPaga),
      Math.max(
        0,
        acumulada.setScale(0, RoundingMode.HALF_UP).longValueExact() - moraPaga
      ),
      recebido
    );
  }

  private BigDecimal encargoExato(long base, String taxa, long dias) {
    return BigDecimal.valueOf(base)
      .multiply(new BigDecimal(taxa))
      .movePointLeft(2)
      .multiply(BigDecimal.valueOf(dias));
  }

  private long encargo(long base, String taxa, long dias) {
    return encargoExato(base, taxa, dias)
      .setScale(0, RoundingMode.HALF_UP)
      .longValueExact();
  }

  public Parcela parcela(
    Map<String, Object> c,
    Map<String, Object> p,
    LocalDate data
  ) {
    String id = texto(p, "id");
    LocalDate venc = LocalDate.parse(texto(p, "vencimento"));
    boolean cancelada = numero(p, "cancelada") == 1;
    Saldo s = saldo(c, p, data);
    long pendente = cancelada ? 0 : s.principal + s.juros + s.multa + s.mora;
    boolean antecipada = r
      .pagamentos(id)
      .stream()
      .anyMatch(pg -> pg.get("antecipacao_id") != null);
    String status = cancelada
      ? "CANCELADO"
      : pendente == 0
        ? antecipada
          ? "ANTECIPADO"
          : "PAGO"
        : data.isAfter(venc)
          ? "EM_ATRASO"
          : s.recebido > 0
            ? "PARCIALMENTE_PAGO"
            : "A_PAGAR";
    return new Parcela(
      id,
      (int) numero(p, "numero"),
      venc,
      valor(numero(p, "principal_centavos")),
      valor(numero(p, "juros_centavos")),
      valor(numero(p, "principal_centavos") + numero(p, "juros_centavos")),
      valor(s.recebido),
      valor(cancelada ? 0 : s.multa),
      valor(cancelada ? 0 : s.mora),
      valor(pendente),
      valor(cancelada ? 0 : s.principal),
      valor(cancelada ? 0 : s.juros),
      status
    );
  }

  @Transactional(readOnly = true)
  public Extrato extrato(String id) {
    var c = r.obter("contratos", id);
    c.put("cliente_nome", clientes.obter(texto(c, "cliente_id")).nome);
    var ps = r
      .parcelas(id)
      .stream()
      .map(p -> parcela(c, p, hoje()))
      .toList();
    long previsto = 0,
      principal = 0,
      juros = 0,
      encargos = 0,
      recebido = 0,
      atraso = 0,
      saldo = 0,
      pagas = 0,
      pendentes = 0;
    for (Parcela p : ps) {
      if (!p.status.equals("CANCELADO")) previsto += cents(p.previsto);
      principal += cents(p.principalPendente);
      if (!p.vencimento.isBefore(hoje())) juros += cents(p.jurosPendentes);
      encargos += cents(p.multa.add(p.mora));
      recebido += cents(p.recebido);
      saldo += cents(p.saldo);
      if (p.status.equals("EM_ATRASO")) atraso += cents(p.saldo);
      if (p.status.equals("PAGO") || p.status.equals("ANTECIPADO")) pagas++;
      else if (!p.status.equals("CANCELADO")) pendentes++;
    }
    var pagamentos = r
      .jdbc()
      .queryForList(
        "SELECT pg.* FROM pagamentos pg JOIN parcelas p ON p.id=pg.parcela_id WHERE p.contrato_id=? ORDER BY pg.data_efetiva,pg.criado_em",
        id
      );
    var ants = r
      .jdbc()
      .queryForList(
        "SELECT * FROM antecipacoes WHERE contrato_id=? ORDER BY criado_em",
        id
      );
    return new Extrato(
      c,
      ps,
      pagamentos,
      ants,
      new Indicadores(
        valor(numero(c, "principal_centavos")),
        valor(previsto),
        valor(principal),
        valor(juros),
        valor(encargos),
        valor(recebido),
        valor(atraso),
        valor(saldo),
        pagas,
        pendentes
      ),
      saldo == 0 ? "QUITADO" : "ATIVO",
      OffsetDateTime.now(ZoneId.of("America/Sao_Paulo")).toString()
    );
  }

  @Transactional
  public Extrato receber(Receber e) {
    var p = r.obter("parcelas", e.parcelaId);
    String id = texto(p, "contrato_id");
    travar(id);
    registrar(e, null);
    return extrato(id);
  }

  private void registrar(Receber e, String antecipacao) {
    var p = r.obter("parcelas", e.parcelaId);
    var c = r.obter("contratos", texto(p, "contrato_id"));
    validarData(e.data);
    if (numero(p, "cancelada") == 1) throw new IllegalArgumentException(
      "Parcela cancelada."
    );
    var anteriores = r.pagamentos(e.parcelaId);
    if (
      anteriores
        .stream()
        .anyMatch(pg ->
          LocalDate.parse(texto(pg, "data_efetiva")).isAfter(e.data)
        )
    ) throw new IllegalArgumentException(
      "Pagamento retroativo anterior a recebimentos existentes. Estorne os posteriores primeiro."
    );
    Saldo s = saldo(c, p, e.data);
    long v = cents(e.valor),
      rest = v;
    if (
      v <= 0 || v > s.principal + s.juros + s.multa + s.mora
    ) throw new IllegalArgumentException(
      "Valor supera o saldo na data efetiva."
    );
    long multa = Math.min(rest, s.multa);
    rest -= multa;
    long mora = Math.min(rest, s.mora);
    rest -= mora;
    long j = Math.min(rest, s.juros);
    rest -= j;
    r.jdbc().update(
      "INSERT INTO pagamentos(id,parcela_id,antecipacao_id,valor_centavos,principal_centavos,juros_centavos,multa_centavos,mora_centavos,data_efetiva,forma,observacao,criado_em,chave) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
      uuid(),
      e.parcelaId,
      antecipacao,
      v,
      rest,
      j,
      multa,
      mora,
      e.data.toString(),
      e.forma,
      e.observacao,
      Instant.now().toString(),
      e.chave
    );
    historico(texto(c, "id"), "PAGAMENTO", e.chave);
  }

  private void validarData(LocalDate d) {
    if (d.isAfter(hoje())) throw new IllegalArgumentException(
      "Data efetiva não pode ser futura."
    );
  }

  @Transactional
  public Extrato estornar(String pagamentoId, Estornar e) {
    var pg = r.obter("pagamentos", pagamentoId);
    var p = r.obter("parcelas", texto(pg, "parcela_id"));
    String id = texto(p, "contrato_id");
    travar(id);
    if (pg.get("estornado_em") != null) throw new IllegalArgumentException(
      "Pagamento já estornado."
    );
    var lista = r.pagamentos(texto(p, "id"));
    if (
      !texto(lista.getLast(), "id").equals(pagamentoId)
    ) throw new IllegalArgumentException(
      "Estorne os pagamentos posteriores desta parcela primeiro."
    );
    r.jdbc().update(
      "UPDATE pagamentos SET estornado_em=?,justificativa=? WHERE id=?",
      Instant.now().toString(),
      e.justificativa,
      pagamentoId
    );
    historico(id, "ESTORNO", pagamentoId + ": " + e.justificativa);
    return extrato(id);
  }

  public record Alocacao(String parcelaId, int numero, BigDecimal valor) {}

  public record Previa(
    List<Alocacao> alocacoes,
    BigDecimal recebido,
    BigDecimal jurosEliminados,
    Integer novoMes
  ) {}

  @Transactional(readOnly = true)
  public Previa previa(Antecipar e) {
    validarData(e.data);
    var c = r.obter("contratos", e.contratoId);
    var ps = r.parcelas(e.contratoId);
    if (texto(c, "modalidade").equals("SO_JUROS")) {
      if (
        e.novoMes == null || e.novoMes >= numero(c, "mes_quitacao")
      ) throw new IllegalArgumentException(
        "Informe um mês anterior à quitação atual."
      );
      var destino = ps
        .stream()
        .filter(p -> numero(p, "numero") == e.novoMes)
        .findFirst()
        .orElseThrow();
      if (
        LocalDate.parse(texto(destino, "vencimento")).isBefore(hoje())
      ) throw new IllegalArgumentException(
        "Não é permitido eliminar juros de períodos já vencidos."
      );
      for (var p : ps)
        if (
          numero(p, "numero") >= e.novoMes &&
          !r.pagamentos(texto(p, "id")).isEmpty()
        ) throw new IllegalArgumentException(
          "Existem pagamentos no período afetado."
        );
      long eliminados = ps
        .stream()
        .filter(
          p -> numero(p, "numero") > e.novoMes && numero(p, "cancelada") == 0
        )
        .mapToLong(p -> numero(p, "juros_centavos"))
        .sum();
      return new Previa(List.of(), valor(0), valor(eliminados), e.novoMes);
    }
    if (e.valor == null) throw new IllegalArgumentException(
      "Informe o valor recebido."
    );
    long rest = cents(e.valor);
    List<Alocacao> alocacoes = new ArrayList<>();
    for (var p : ps.reversed()) {
      if (rest == 0) break;
      if (numero(p, "cancelada") == 1) continue;
      if (
        r
          .pagamentos(texto(p, "id"))
          .stream()
          .anyMatch(pg ->
            LocalDate.parse(texto(pg, "data_efetiva")).isAfter(e.data)
          )
      ) continue;
      var s = saldo(c, p, e.data);
      long a = Math.min(rest, s.principal + s.juros + s.multa + s.mora);
      if (a > 0) {
        alocacoes.add(
          new Alocacao(texto(p, "id"), (int) numero(p, "numero"), valor(a))
        );
        rest -= a;
      }
    }
    if (rest > 0) throw new IllegalArgumentException(
      "Antecipação supera o saldo elegível na data."
    );
    return new Previa(alocacoes, e.valor, valor(0), null);
  }

  @Transactional
  public Extrato antecipar(Antecipar e) {
    travar(e.contratoId);
    Previa prev = previa(e);
    var c = r.obter("contratos", e.contratoId);
    String ant = uuid();
    // Unique payment keys prevent retries from recording a second receipt. Planning uses the same uniqueness guard in history.
    if (
      r
        .jdbc()
        .queryForObject(
          "SELECT count(*) FROM historico_operacoes WHERE recurso_id=? AND operacao='ANTECIPACAO' AND detalhes=?",
          Long.class,
          e.contratoId,
          e.chave
        ) > 0
    ) throw new IllegalArgumentException("Antecipação já confirmada.");
    r.jdbc().update(
      "INSERT INTO antecipacoes VALUES (?,?,?,?,?,?,?)",
      ant,
      e.contratoId,
      texto(c, "modalidade"),
      cents(prev.recebido),
      e.novoMes,
      e.data.toString(),
      Instant.now().toString()
    );
    if (prev.novoMes != null) {
      r.jdbc().update(
        "UPDATE parcelas SET principal_centavos=0,cancelada=1 WHERE contrato_id=? AND numero>?",
        e.contratoId,
        e.novoMes
      );
      r.jdbc().update(
        "UPDATE parcelas SET principal_centavos=? WHERE contrato_id=? AND numero=?",
        numero(c, "principal_centavos"),
        e.contratoId,
        e.novoMes
      );
      r.jdbc().update(
        "UPDATE contratos SET mes_quitacao=? WHERE id=?",
        e.novoMes,
        e.contratoId
      );
    } else for (var a : prev.alocacoes)
      registrar(
        new Receber(
          a.parcelaId,
          a.valor,
          e.data,
          "Antecipação",
          "Aplicação nas últimas parcelas",
          e.chave + ":" + a.parcelaId
        ),
        ant
      );
    historico(e.contratoId, "ANTECIPACAO", e.chave);
    return extrato(e.contratoId);
  }

  @Transactional(readOnly = true)
  public List<Map<String, Object>> historico(String contratoId) {
    r.obter("contratos", contratoId);
    return r
      .jdbc()
      .queryForList(
        "SELECT * FROM historico_operacoes WHERE recurso_id=? ORDER BY criado_em",
        contratoId
      );
  }
}
