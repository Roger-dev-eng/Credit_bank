package app.credito.config;

import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.*;

@Configuration
public class MigracaoProtegidaConfig {

  @Bean
  FlywayMigrationStrategy migracaoProtegida(BackupService backups) {
    return flyway -> {
      if (
        flyway.info().applied().length > 0 && flyway.info().pending().length > 0
      ) {
        try {
          backups.criarPersistente("antes-migracao");
        } catch (Exception e) {
          throw new IllegalStateException(
            "Migração bloqueada: não foi possível proteger o banco com backup.",
            e
          );
        }
      }
      flyway.migrate();
    };
  }
}
