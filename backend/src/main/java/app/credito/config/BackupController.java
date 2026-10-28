package app.credito.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/backups")
public class BackupController {

  private final BackupService service;

  public BackupController(BackupService s) {
    service = s;
  }

  public record Restaurar(
    @NotNull @Size(min = 100, max = 100000000) byte[] conteudo
  ) {}

  @GetMapping
  public ResponseEntity<byte[]> backup() throws Exception {
    return ResponseEntity.ok()
      .header("Content-Disposition", "attachment; filename=gestao-credito.db")
      .contentType(MediaType.APPLICATION_OCTET_STREAM)
      .body(service.exportar());
  }

  @PostMapping("/restaurar")
  public Map<String, Boolean> restaurar(@RequestBody @Valid Restaurar e)
    throws Exception {
    service.restaurar(e.conteudo);
    return Map.of("restaurado", true);
  }
}
