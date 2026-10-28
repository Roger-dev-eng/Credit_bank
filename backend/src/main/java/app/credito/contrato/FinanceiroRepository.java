package app.credito.contrato;

import app.credito.shared.NaoEncontrado;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class FinanceiroRepository {

  public final JdbcTemplate jdbc;

  public FinanceiroRepository(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public JdbcTemplate jdbc() {
    return jdbc;
  }

  public Map<String, Object> obter(String tabela, String id) {
    if (
      !Set.of("contratos", "parcelas", "pagamentos").contains(tabela)
    ) throw new IllegalArgumentException("Recurso inválido");
    var rows = jdbc.queryForList("SELECT * FROM " + tabela + " WHERE id=?", id);
    if (rows.isEmpty()) throw new NaoEncontrado();
    return rows.getFirst();
  }

  public List<Map<String, Object>> parcelas(String contrato) {
    return jdbc.queryForList(
      "SELECT * FROM parcelas WHERE contrato_id=? ORDER BY numero",
      contrato
    );
  }

  public List<Map<String, Object>> pagamentos(String parcela) {
    return jdbc.queryForList(
      "SELECT * FROM pagamentos WHERE parcela_id=? AND estornado_em IS NULL ORDER BY data_efetiva,criado_em,id",
      parcela
    );
  }

  public static String texto(Map<String, Object> r, String k) {
    return Objects.toString(r.get(k), "");
  }

  public static long numero(Map<String, Object> r, String k) {
    return ((Number) r.get(k)).longValue();
  }
}
