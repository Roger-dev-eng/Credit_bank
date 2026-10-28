package app.credito.config;

import static org.assertj.core.api.Assertions.*;

import java.nio.file.*;
import java.sql.*;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.sqlite.SQLiteDataSource;

class MigracaoProtegidaTest {

  @Test
  void atualizaEsquemaPreservandoDadosECriandoBackupAnterior()
    throws Exception {
    Path dir = Files.createTempDirectory("migracao-protegida-");
    Path migrations = Files.createDirectory(dir.resolve("migrations"));
    Files.writeString(
      migrations.resolve("V1__inicial.sql"),
      "CREATE TABLE clientes(id TEXT PRIMARY KEY,nome TEXT NOT NULL); INSERT INTO clientes VALUES ('preservado','Cliente existente');"
    );
    var source = new SQLiteDataSource();
    source.setUrl("jdbc:sqlite:" + dir.resolve("credito.db"));
    Flyway flyway = Flyway.configure()
      .dataSource(source)
      .locations("filesystem:" + migrations)
      .load();
    flyway.migrate();
    Files.writeString(
      migrations.resolve("V2__campo.sql"),
      "ALTER TABLE clientes ADD COLUMN telefone TEXT;"
    );
    flyway = Flyway.configure()
      .dataSource(source)
      .locations("filesystem:" + migrations)
      .load();
    new MigracaoProtegidaConfig()
      .migracaoProtegida(new BackupService(source, dir.toString()))
      .migrate(flyway);
    try (
      var c = source.getConnection();
      var s = c.createStatement();
      var rs = s.executeQuery(
        "SELECT nome,telefone FROM clientes WHERE id='preservado'"
      )
    ) {
      assertThat(rs.getString(1)).isEqualTo("Cliente existente");
      assertThat(rs.getString(2)).isNull();
    }
    Path backup;
    try (var files = Files.list(dir.resolve("backups"))) {
      backup = files.findFirst().orElseThrow();
    }
    try (
      var c = DriverManager.getConnection("jdbc:sqlite:" + backup);
      var s = c.createStatement()
    ) {
      try (
        var rs = s.executeQuery(
          "SELECT nome FROM clientes WHERE id='preservado'"
        )
      ) {
        assertThat(rs.getString(1)).isEqualTo("Cliente existente");
      }
      assertThatThrownBy(() ->
        s.executeQuery("SELECT telefone FROM clientes")
      ).isInstanceOf(SQLException.class);
    }
  }
}
