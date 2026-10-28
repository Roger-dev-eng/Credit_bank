package app.credito.config;

import java.nio.file.*;
import java.sql.*;
import java.time.Instant;
import java.util.*;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.sqlite.SQLiteConnection;

@Service
public class BackupService {

  private final DataSource source;
  private final Path dir;

  public BackupService(DataSource s, @Value("${credito.data-dir}") String dir) {
    source = s;
    this.dir = Path.of(dir);
  }

  public synchronized byte[] exportar() throws Exception {
    Path path = dir
      .resolve("backups")
      .resolve("export-" + UUID.randomUUID() + ".db");
    Files.createDirectories(path.getParent());
    try (var c = source.getConnection()) {
      if (
        c
          .unwrap(SQLiteConnection.class)
          .getDatabase()
          .backup("main", path.toString(), null) != 0
      ) throw new IllegalStateException("Não foi possível gerar o backup.");
    }
    try {
      return Files.readAllBytes(path);
    } finally {
      Files.deleteIfExists(path);
    }
  }

  public synchronized Path criarPersistente(String motivo) throws Exception {
    if (
      !Set.of("antes-atualizacao", "antes-migracao").contains(motivo)
    ) throw new IllegalArgumentException("Tipo de backup inválido.");
    Path path = dir
      .resolve("backups")
      .resolve(
        motivo +
          "-" +
          Instant.now().toEpochMilli() +
          "-" +
          UUID.randomUUID() +
          ".db"
      );
    Files.createDirectories(path.getParent());
    try (var c = source.getConnection()) {
      if (
        c
          .unwrap(SQLiteConnection.class)
          .getDatabase()
          .backup("main", path.toString(), null) != 0
      ) throw new IllegalStateException(
        "A atualização foi interrompida porque o backup não pôde ser criado."
      );
    }
    return path;
  }

  public synchronized void restaurar(byte[] bytes) throws Exception {
    if (
      bytes.length < 100 || bytes.length > 100_000_000
    ) throw new IllegalArgumentException("Tamanho do backup inválido.");
    Path staged = Files.createTempFile(dir, "restaurar-", ".db");
    try {
      Files.write(staged, bytes);
      try (
        var c = DriverManager.getConnection("jdbc:sqlite:" + staged);
        var s = c.createStatement()
      ) {
        try (var rs = s.executeQuery("PRAGMA integrity_check")) {
          if (
            !rs.next() || !rs.getString(1).equals("ok")
          ) throw new IllegalArgumentException("Backup corrompido.");
        }
        try (var rs = s.executeQuery("PRAGMA foreign_key_check")) {
          if (rs.next()) throw new IllegalArgumentException(
            "Backup possui vínculos inválidos."
          );
        }
      }
      // Validate checksums/version using the same migration set before touching the active database.
      Flyway.configure()
        .dataSource("jdbc:sqlite:" + staged, null, null)
        .load()
        .validate();
      try (
        var c = DriverManager.getConnection("jdbc:sqlite:" + staged);
        var s = c.createStatement()
      ) {
        for (String table : List.of(
          "clientes",
          "contratos",
          "parcelas",
          "pagamentos",
          "antecipacoes",
          "historico_operacoes"
        ))
          s.executeQuery("SELECT * FROM " + table + " LIMIT 0").close();
      }
      Path safety = dir
        .resolve("backups")
        .resolve("antes-restauracao-" + Instant.now().toEpochMilli() + ".db");
      Files.createDirectories(safety.getParent());
      try (var c = source.getConnection()) {
        var db = c.unwrap(SQLiteConnection.class).getDatabase();
        if (
          db.backup("main", safety.toString(), null) != 0
        ) throw new IllegalStateException(
          "Não foi possível preservar o banco atual."
        );
        if (
          db.restore("main", staged.toString(), null) != 0
        ) throw new IllegalStateException(
          "Falha na restauração; cópia de segurança preservada."
        );
      }
    } finally {
      Files.deleteIfExists(staged);
    }
  }
}
