package app.credito.calculo;

import jakarta.validation.constraints.*;
import java.math.*;
import java.time.LocalDate;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class Calculadora {

  public static final BigDecimal ZERO = new BigDecimal("0.00");

  public static BigDecimal moeda(BigDecimal v) {
    return v.setScale(2, RoundingMode.HALF_UP);
  }

  public enum Modalidade {
    PARCELA_FIXA,
    SO_JUROS,
  }

  public record Entrada(
    @NotNull Modalidade modalidade,
    @NotNull
    @DecimalMin("0.01")
    @DecimalMax("1000000000")
    @Digits(integer = 10, fraction = 2)
    BigDecimal principal,
    @NotNull
    @DecimalMin("0")
    @DecimalMax("100")
    @Digits(integer = 3, fraction = 6)
    BigDecimal taxa,
    @Min(1) @Max(600) Integer prazo,
    @DecimalMin("0.01")
    @Digits(integer = 10, fraction = 2)
    BigDecimal parcelaDesejada,
    @Min(1) @Max(600) Integer mesQuitacao,
    @NotNull LocalDate primeiroVencimento,
    @NotNull @DecimalMin("0") @DecimalMax("100") BigDecimal multa,
    @NotNull @DecimalMin("0") @DecimalMax("100") BigDecimal mora
  ) {}

  public record Linha(
    int numero,
    LocalDate vencimento,
    BigDecimal principal,
    BigDecimal juros,
    BigDecimal previsto
  ) {}

  public record Resultado(
    Entrada entrada,
    int prazo,
    int mesQuitacao,
    BigDecimal parcela,
    BigDecimal jurosTotais,
    BigDecimal total,
    List<Linha> parcelas
  ) {}

  public Resultado simular(Entrada e) {
    BigDecimal mensal = moeda(e.principal.multiply(e.taxa).movePointLeft(2));
    int n = e.prazo == null ? 0 : e.prazo;
    if (e.modalidade == Modalidade.PARCELA_FIXA && e.parcelaDesejada != null) {
      BigDecimal amortizacao = e.parcelaDesejada.subtract(mensal);
      if (amortizacao.signum() <= 0) throw new IllegalArgumentException(
        "A parcela deve superar os juros mensais."
      );
      n = e.principal
        .divide(amortizacao, 0, RoundingMode.CEILING)
        .intValueExact();
    }
    if (n < 1 || n > 600) throw new IllegalArgumentException(
      "O prazo deve ser de 1 a 600 meses."
    );
    int q =
      e.modalidade == Modalidade.SO_JUROS
        ? e.mesQuitacao == null
          ? n
          : e.mesQuitacao
        : n;
    if (q < 1 || q > n) throw new IllegalArgumentException(
      "A quitação deve ocorrer dentro do horizonte."
    );
    BigDecimal regular = e.principal.divide(
      BigDecimal.valueOf(n),
      2,
      RoundingMode.DOWN
    );
    List<Linha> linhas = new ArrayList<>();
    for (int k = 1; k <= q; k++) {
      BigDecimal p =
        e.modalidade == Modalidade.SO_JUROS
          ? k == q
            ? moeda(e.principal)
            : ZERO
          : k == n
            ? moeda(
                e.principal.subtract(
                  regular.multiply(BigDecimal.valueOf(n - 1))
                )
              )
            : regular;
      linhas.add(
        new Linha(
          k,
          e.primeiroVencimento.plusMonths(k - 1),
          p,
          mensal,
          p.add(mensal)
        )
      );
    }
    BigDecimal j = mensal.multiply(BigDecimal.valueOf(q));
    return new Resultado(
      e,
      n,
      q,
      linhas.getFirst().previsto,
      j,
      moeda(e.principal.add(j)),
      List.copyOf(linhas)
    );
  }
}
