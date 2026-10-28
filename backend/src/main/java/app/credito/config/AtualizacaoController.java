package app.credito.config;

import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/atualizacoes")
public class AtualizacaoController {

  private final ManutencaoService manutencao;

  public AtualizacaoController(ManutencaoService manutencao) {
    this.manutencao = manutencao;
  }

  @PostMapping("/preparar")
  public Map<String, String> preparar() throws Exception {
    return Map.of("backup", manutencao.preparar().toString());
  }

  @PostMapping("/liberar")
  public Map<String, Boolean> liberar() {
    manutencao.liberar();
    return Map.of("liberado", true);
  }
}
