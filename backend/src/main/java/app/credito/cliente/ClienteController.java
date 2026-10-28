package app.credito.cliente;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
@RestController @RequestMapping("/api/clientes")
public class ClienteController {
 private final ClienteService service;
 public ClienteController(ClienteService s){service=s;}
 @GetMapping public List<Cliente> listar(@RequestParam(defaultValue="") String busca){return service.listar(busca);}
 @GetMapping("/{id}") public Cliente obter(@PathVariable String id){return service.obter(id);}
 @PostMapping public Cliente criar(@RequestBody @Valid ClienteService.Entrada e){return service.salvar(null,e);}
 @PutMapping("/{id}") public Cliente editar(@PathVariable String id,@RequestBody @Valid ClienteService.Entrada e){return service.salvar(id,e);}
 @DeleteMapping("/{id}") public void excluir(@PathVariable String id){service.excluir(id);}
}
