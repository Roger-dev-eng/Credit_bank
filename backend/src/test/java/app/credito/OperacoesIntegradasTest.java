package app.credito;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import app.credito.calculo.Calculadora.*;
import app.credito.cliente.ClienteService;
import app.credito.config.BackupService;
import app.credito.contrato.ContratoService;
import app.credito.contrato.ContratoService.*;
import app.credito.relatorio.RelatorioController;
import java.math.BigDecimal;
import java.nio.file.*;
import java.sql.DriverManager;
import java.util.*;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(
  properties = "credito.token=token-de-integracao-local-com-mais-de-32-caracteres"
)
@AutoConfigureMockMvc
class OperacoesIntegradasTest {

  static final Path DIR;

  static {
    try {
      DIR = Files.createTempDirectory("credito-integracao-");
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  @DynamicPropertySource
  static void props(DynamicPropertyRegistry r) {
    r.add("credito.data-dir", () -> DIR.toString().replace('\\', '/'));
  }

  @Autowired
  ContratoService contratos;

  @Autowired
  ClienteService clientes;

  @Autowired
  BackupService backup;

  @Autowired
  RelatorioController relatorios;

  @Autowired
  JdbcTemplate jdbc;

  @Autowired
  MockMvc mvc;

  Extrato novo() {
    var c = clientes.salvar(
      null,
      new ClienteService.Entrada("Integração", null, null)
    );
    return contratos.criar(
      new Criar(
        c.id,
        new Entrada(
          Modalidade.PARCELA_FIXA,
          new BigDecimal("1000"),
          new BigDecimal("3"),
          2,
          null,
          null,
          ContratoService.hoje().plusMonths(1),
          new BigDecimal("2"),
          new BigDecimal("0.1")
        )
      )
    );
  }

  @Test
  void commitReabrirERollbackDeAntecipacaoDuplicada() throws Exception {
    var e = novo();
    String id = e.contrato().get("id").toString();
    var ant = new Antecipar(
      id,
      new BigDecimal("600"),
      null,
      ContratoService.hoje(),
      UUID.randomUUID().toString()
    );
    contratos.antecipar(ant);
    assertThatThrownBy(() -> contratos.antecipar(ant)).isInstanceOf(
      RuntimeException.class
    );
    assertThat(
      contratos.extrato(id).indicadores().recebido()
    ).isEqualByComparingTo("600");
    try (
      var c = DriverManager.getConnection(
        "jdbc:sqlite:" + DIR.resolve("credito.db")
      );
      var s = c.prepareStatement(
        "SELECT sum(pg.valor_centavos) FROM pagamentos pg JOIN parcelas p ON p.id=pg.parcela_id WHERE p.contrato_id=?"
      )
    ) {
      s.setString(1, id);
      try (var rs = s.executeQuery()) {
        assertThat(rs.getLong(1)).isEqualTo(60000);
      }
    }
  }

  @Test
  void backupRestauracaoPreservaCopia() throws Exception {
    novo();
    byte[] bytes = backup.exportar();
    Long antes = jdbc.queryForObject(
      "SELECT count(*) FROM clientes",
      Long.class
    );
    clientes.salvar(
      null,
      new ClienteService.Entrada("Depois do backup", null, null)
    );
    backup.restaurar(bytes);
    assertThat(
      jdbc.queryForObject("SELECT count(*) FROM clientes", Long.class)
    ).isEqualTo(antes);
    try (var paths = Files.list(DIR.resolve("backups"))) {
      assertThat(
        paths.anyMatch(p ->
          p.getFileName().toString().startsWith("antes-restauracao-")
        )
      ).isTrue();
    }
  }

  @Test
  void backupInvalidoPreservaBanco() {
    novo();
    Long antes = jdbc.queryForObject(
      "SELECT count(*) FROM clientes",
      Long.class
    );
    assertThatThrownBy(() -> backup.restaurar(new byte[101])).isInstanceOf(
      Exception.class
    );
    assertThat(
      jdbc.queryForObject("SELECT count(*) FROM clientes", Long.class)
    ).isEqualTo(antes);
  }

  @Test
  void pdfComValoresEPaginacao() throws Exception {
    var e = novo();
    byte[] bytes = relatorios.pdf(e.contrato().get("id").toString()).getBody();
    try (var doc = Loader.loadPDF(bytes)) {
      assertThat(doc.getNumberOfPages()).isPositive();
      String text = new PDFTextStripper().getText(doc);
      assertThat(text).contains("Gestão de Crédito", "1.060,00", "1.000,00");
    }
  }

  @Test
  void apiProtegida() throws Exception {
    mvc.perform(get("/api/clientes")).andExpect(status().isForbidden());
    mvc
      .perform(get("/api/clientes").header("X-Credito-Token", "errado"))
      .andExpect(status().isForbidden());
    mvc
      .perform(
        get("/api/clientes")
          .header(
            "X-Credito-Token",
            "token-de-integracao-local-com-mais-de-32-caracteres"
          )
          .header("Origin", "https://exemplo.com")
      )
      .andExpect(status().isForbidden());
    mvc
      .perform(
        get("/api/clientes").header(
          "X-Credito-Token",
          "token-de-integracao-local-com-mais-de-32-caracteres"
        )
      )
      .andExpect(status().isOk());
  }

  @Test
  void validacaoBackend() throws Exception {
    mvc
      .perform(
        post("/api/clientes")
          .header(
            "X-Credito-Token",
            "token-de-integracao-local-com-mais-de-32-caracteres"
          )
          .contentType("application/json")
          .content("{\"nome\":\"  \"}")
      )
      .andExpect(status().isBadRequest());
  }
}
