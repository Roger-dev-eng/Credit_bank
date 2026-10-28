package app.credito;

import static org.assertj.core.api.Assertions.*;

import app.credito.calculo.Calculadora;
import app.credito.calculo.Calculadora.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class CalculadoraTest {

  final Calculadora calc = new Calculadora();

  Entrada entrada(String principal, String taxa, int n, Modalidade m) {
    return new Entrada(
      m,
      new BigDecimal(principal),
      new BigDecimal(taxa),
      n,
      null,
      n,
      LocalDate.of(2024, 1, 31),
      BigDecimal.ZERO,
      BigDecimal.ZERO
    );
  }

  @Test
  void flat() {
    var s = calc.simular(entrada("10000", "3", 6, Modalidade.PARCELA_FIXA));
    assertThat(s.total()).isEqualByComparingTo("11800");
    assertThat(
      s
        .parcelas()
        .stream()
        .map(Linha::principal)
        .reduce(BigDecimal.ZERO, BigDecimal::add)
    ).isEqualByComparingTo("10000");
  }

  @Test
  void soJuros() {
    var s = calc.simular(entrada("10000", "3", 6, Modalidade.SO_JUROS));
    assertThat(s.parcelas().getFirst().previsto()).isEqualByComparingTo("300");
    assertThat(s.parcelas().getLast().previsto()).isEqualByComparingTo("10300");
    assertThat(s.total()).isEqualByComparingTo("11800");
  }

  @Test
  void calendarioAncorado() {
    var s = calc.simular(entrada("100", "0", 3, Modalidade.PARCELA_FIXA));
    assertThat(s.parcelas().get(1).vencimento()).isEqualTo(
      LocalDate.of(2024, 2, 29)
    );
    assertThat(s.parcelas().get(2).vencimento()).isEqualTo(
      LocalDate.of(2024, 3, 31)
    );
  }

  @Test
  void arredondamento() {
    var s = calc.simular(entrada("100", "0", 3, Modalidade.PARCELA_FIXA));
    assertThat(s.parcelas().getFirst().principal()).isEqualByComparingTo(
      "33.33"
    );
    assertThat(s.parcelas().getLast().principal()).isEqualByComparingTo(
      "33.34"
    );
  }

  @Test
  void fevereiroNaoBissexto() {
    var a = entrada("100", "0", 3, Modalidade.PARCELA_FIXA);
    var s = calc.simular(
      new Entrada(
        a.modalidade(),
        a.principal(),
        a.taxa(),
        3,
        null,
        3,
        LocalDate.of(2025, 1, 31),
        a.multa(),
        a.mora()
      )
    );
    assertThat(s.parcelas().get(1).vencimento()).isEqualTo(
      LocalDate.of(2025, 2, 28)
    );
  }

  @Test
  void bidirecional() {
    var a = entrada("1000", "3", 12, Modalidade.PARCELA_FIXA);
    var s = calc.simular(
      new Entrada(
        a.modalidade(),
        a.principal(),
        a.taxa(),
        null,
        new BigDecimal("130"),
        null,
        a.primeiroVencimento(),
        a.multa(),
        a.mora()
      )
    );
    assertThat(s.prazo()).isEqualTo(10);
  }

  @Test
  void impossivel() {
    var a = entrada("1000", "3", 12, Modalidade.PARCELA_FIXA);
    assertThatThrownBy(() ->
      calc.simular(
        new Entrada(
          a.modalidade(),
          a.principal(),
          a.taxa(),
          null,
          new BigDecimal("30"),
          null,
          a.primeiroVencimento(),
          a.multa(),
          a.mora()
        )
      )
    ).isInstanceOf(IllegalArgumentException.class);
  }
}
