package app.credito;

import static org.assertj.core.api.Assertions.*;

import app.credito.calculo.Calculadora.*;
import app.credito.cliente.ClienteService;
import app.credito.contrato.ContratoService;
import app.credito.contrato.ContratoService.*;
import java.math.BigDecimal;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(
  properties = "credito.token=teste-isolado-com-mais-de-trinta-e-dois-caracteres"
)
@Transactional
class FinanceiroTest {

  static final Path DIR;

  static {
    try {
      DIR = Files.createTempDirectory("credito-test-");
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  @DynamicPropertySource
  static void properties(DynamicPropertyRegistry r) {
    r.add("credito.data-dir", () -> DIR.toString().replace('\\', '/'));
  }

  @Autowired
  ContratoService service;

  @Autowired
  ClienteService clientes;

  @Autowired
  JdbcTemplate jdbc;

  Extrato contrato(Modalidade m, LocalDate date, int n) {
    String cliente = clientes
      .salvar(null, new ClienteService.Entrada("Teste isolado", null, null))
      .id;
    return service.criar(
      new Criar(
        cliente,
        new Entrada(
          m,
          new BigDecimal("1000"),
          new BigDecimal("3"),
          n,
          null,
          n,
          date,
          new BigDecimal("2"),
          new BigDecimal("0.1")
        )
      )
    );
  }

  Receber pagamento(String id, String valor, LocalDate dia) {
    return new Receber(
      id,
      new BigDecimal(valor),
      dia,
      "PIX",
      null,
      UUID.randomUUID().toString()
    );
  }

  @Test
  void parcialIntegralQuitacao() {
    var x = contrato(Modalidade.PARCELA_FIXA, ContratoService.hoje(), 1);
    String id = x.parcelas().getFirst().id();
    x = service.receber(pagamento(id, "30", ContratoService.hoje()));
    assertThat(x.indicadores().recebido()).isEqualByComparingTo("30");
    assertThat(x.indicadores().principalDevido()).isEqualByComparingTo("1000");
    assertThat(x.parcelas().getFirst().status()).isEqualTo("PARCIALMENTE_PAGO");
    x = service.receber(pagamento(id, "1000", ContratoService.hoje()));
    assertThat(x.status()).isEqualTo("QUITADO");
    assertThat(x.indicadores().saldo()).isEqualByComparingTo("0");
  }

  @Test
  void multaMoraParcial() {
    var x = contrato(
      Modalidade.PARCELA_FIXA,
      ContratoService.hoje().minusDays(10),
      1
    );
    String id = x.parcelas().getFirst().id();
    assertThat(x.parcelas().getFirst().multa()).isEqualByComparingTo("20.60");
    assertThat(x.parcelas().getFirst().mora()).isEqualByComparingTo("10.30");
    x = service.receber(
      pagamento(id, "550", ContratoService.hoje().minusDays(5))
    );
    assertThat(x.indicadores().recebido()).isEqualByComparingTo("550");
    assertThat(x.parcelas().getFirst().multa()).isEqualByComparingTo("0");
    assertThat(x.parcelas().getFirst().mora()).isEqualByComparingTo("2.53");
    assertThat(
      x.parcelas().getFirst().principalPendente()
    ).isEqualByComparingTo("505.75");
  }

  @Test
  void duplicacaoRollback() {
    var x = contrato(Modalidade.PARCELA_FIXA, ContratoService.hoje(), 1);
    var p = pagamento(
      x.parcelas().getFirst().id(),
      "20",
      ContratoService.hoje()
    );
    service.receber(p);
    assertThatThrownBy(() -> service.receber(p)).isInstanceOf(
      RuntimeException.class
    );
  }

  @Test
  void excedenteNaoRegistra() {
    var x = contrato(Modalidade.PARCELA_FIXA, ContratoService.hoje(), 1);
    assertThatThrownBy(() ->
      service.receber(
        pagamento(x.parcelas().getFirst().id(), "2000", ContratoService.hoje())
      )
    ).isInstanceOf(IllegalArgumentException.class);
    assertThat(
      service.extrato(x.contrato().get("id").toString()).pagamentos()
    ).isEmpty();
  }

  @Test
  void antecipacaoFixa() {
    var x = contrato(
      Modalidade.PARCELA_FIXA,
      ContratoService.hoje().plusMonths(1),
      2
    );
    String id = x.contrato().get("id").toString();
    var a = new Antecipar(
      id,
      new BigDecimal("600"),
      null,
      ContratoService.hoje(),
      UUID.randomUUID().toString()
    );
    assertThat(service.previa(a).alocacoes()).hasSize(2);
    x = service.antecipar(a);
    assertThat(x.indicadores().recebido()).isEqualByComparingTo("600");
    assertThat(x.indicadores().saldo()).isEqualByComparingTo("460");
    assertThat(x.parcelas().getLast().status()).isEqualTo("ANTECIPADO");
  }

  @Test
  void antecipacaoJurosPreservaPagamentos() {
    var x = contrato(Modalidade.SO_JUROS, ContratoService.hoje(), 6);
    String id = x.contrato().get("id").toString();
    service.receber(
      pagamento(x.parcelas().getFirst().id(), "30", ContratoService.hoje())
    );
    x = service.antecipar(
      new Antecipar(
        id,
        null,
        3,
        ContratoService.hoje(),
        UUID.randomUUID().toString()
      )
    );
    assertThat(x.indicadores().previsto()).isEqualByComparingTo("1090");
    assertThat(x.indicadores().recebido()).isEqualByComparingTo("30");
    assertThat(x.parcelas().get(2).principal()).isEqualByComparingTo("1000");
  }

  @Test
  void estornoAuditavel() {
    var x = contrato(Modalidade.PARCELA_FIXA, ContratoService.hoje(), 1);
    x = service.receber(
      pagamento(x.parcelas().getFirst().id(), "30", ContratoService.hoje())
    );
    x = service.estornar(
      x.pagamentos().getFirst().get("id").toString(),
      new Estornar("Valor informado incorretamente")
    );
    assertThat(x.indicadores().recebido()).isEqualByComparingTo("0");
    assertThat(x.pagamentos().getFirst().get("estornado_em")).isNotNull();
  }

  @Test
  void chavesEstrangeirasEExclusao() {
    var x = contrato(Modalidade.SO_JUROS, ContratoService.hoje(), 1);
    assertThat(
      jdbc.queryForObject("PRAGMA foreign_keys", Integer.class)
    ).isEqualTo(1);
    assertThatThrownBy(() ->
      clientes.excluir(x.contrato().get("cliente_id").toString())
    ).isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void consultaNaoGrava() {
    var x = contrato(
      Modalidade.PARCELA_FIXA,
      ContratoService.hoje().minusDays(2),
      1
    );
    Long antes = jdbc.queryForObject(
      "SELECT count(*) FROM historico_operacoes",
      Long.class
    );
    service.extrato(x.contrato().get("id").toString());
    assertThat(
      jdbc.queryForObject(
        "SELECT count(*) FROM historico_operacoes",
        Long.class
      )
    ).isEqualTo(antes);
  }

  @Test
  void jurosAntecipadosNaoAlteramMesPago() {
    var x = contrato(
      Modalidade.SO_JUROS,
      ContratoService.hoje().minusMonths(3),
      6
    );
    String id = x.contrato().get("id").toString();
    service.receber(
      pagamento(x.parcelas().get(3).id(), "10", ContratoService.hoje())
    );
    assertThatThrownBy(() ->
      service.antecipar(
        new Antecipar(
          id,
          null,
          4,
          ContratoService.hoje(),
          UUID.randomUUID().toString()
        )
      )
    ).isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void semMoraAntesDoVencimento() {
    var x = contrato(
      Modalidade.PARCELA_FIXA,
      ContratoService.hoje().plusMonths(1),
      1
    );
    assertThat(x.parcelas().getFirst().mora()).isEqualByComparingTo("0");
    assertThat(x.parcelas().getFirst().multa()).isEqualByComparingTo("0");
  }
}
