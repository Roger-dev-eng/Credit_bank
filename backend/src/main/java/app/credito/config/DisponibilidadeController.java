package app.credito.config;

import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
public class DisponibilidadeController {

  @GetMapping("/api/health")
  public Map<String, String> health() {
    return Map.of("status", "UP");
  }
}
