package app.credito.config;

import java.nio.file.Path;
import org.springframework.stereotype.Service;

@Service
public class ManutencaoService {

  private volatile Path backup;
  private final BackupService backups;

  public ManutencaoService(BackupService backups) {
    this.backups = backups;
  }

  public boolean ativa() {
    return backup != null;
  }

  public synchronized Path preparar() throws Exception {
    if (backup == null) backup = backups.criarPersistente("antes-atualizacao");
    return backup;
  }

  public synchronized void liberar() {
    backup = null;
  }
}
