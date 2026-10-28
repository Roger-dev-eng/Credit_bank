package app.credito.contrato;
import app.credito.calculo.Calculadora;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api")
public class ContratoController {
 private final ContratoService service;private final Calculadora calc;
 public ContratoController(ContratoService s,Calculadora c){service=s;calc=c;}
 @PostMapping("/simulacoes") public Calculadora.Resultado simular(@RequestBody @Valid Calculadora.Entrada e){return calc.simular(e);}
 @PostMapping("/contratos") public ContratoService.Extrato criar(@RequestBody @Valid ContratoService.Criar e){return service.criar(e);}
 @GetMapping("/contratos") public List<ContratoService.Extrato> listar(@RequestParam(required=false) String clienteId){return service.listar(clienteId);}
 @GetMapping({"/contratos/{id}","/contratos/{id}/extrato"}) public ContratoService.Extrato extrato(@PathVariable String id){return service.extrato(id);}
 @GetMapping("/contratos/{id}/parcelas") public List<ContratoService.Parcela> parcelas(@PathVariable String id){return service.extrato(id).parcelas();}
 @GetMapping("/contratos/{id}/historico") public List<Map<String,Object>> historico(@PathVariable String id){return service.historico(id);}
 @PostMapping("/pagamentos") public ContratoService.Extrato receber(@RequestBody @Valid ContratoService.Receber e){return service.receber(e);}
 @PostMapping("/pagamentos/{id}/estorno") public ContratoService.Extrato estornar(@PathVariable String id,@RequestBody @Valid ContratoService.Estornar e){return service.estornar(id,e);}
 @PostMapping("/antecipacoes/previa") public ContratoService.Previa previa(@RequestBody @Valid ContratoService.Antecipar e){return service.previa(e);}
 @PostMapping("/antecipacoes") public ContratoService.Extrato antecipar(@RequestBody @Valid ContratoService.Antecipar e){return service.antecipar(e);}
}
