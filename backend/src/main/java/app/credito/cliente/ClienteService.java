package app.credito.cliente;
import jakarta.validation.constraints.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import java.time.Instant;
import java.util.*;
import app.credito.shared.NaoEncontrado;

@Service
public class ClienteService {
 public record Entrada(@NotBlank @Size(max=150) String nome,@Size(max=40) String telefone,@Size(max=4000) String observacoes) {}
 private final ClienteRepository repository; private final JdbcTemplate jdbc;
 public ClienteService(ClienteRepository r,JdbcTemplate j) {repository=r;jdbc=j;}
 public List<Cliente> listar(String busca) {return repository.findByNomeContainingIgnoreCaseOrderByNomeAsc(busca);}
 public Cliente obter(String id) {return repository.findById(id).orElseThrow(NaoEncontrado::new);}
 @Transactional public Cliente salvar(String id,Entrada e) {
  Cliente c = id == null ? new Cliente() : obter(id);
  if(id==null){c.id=UUID.randomUUID().toString();c.criadoEm=Instant.now().toString();}
  c.nome=e.nome.trim();c.telefone=e.telefone;c.observacoes=e.observacoes;c.atualizadoEm=Instant.now().toString();
  return repository.save(c);
 }
 @Transactional public void excluir(String id) {
  Cliente c=obter(id);
  if(jdbc.queryForObject("SELECT count(*) FROM contratos WHERE cliente_id=?",Long.class,id)>0) throw new IllegalArgumentException("Cliente possui contratos vinculados.");
  repository.delete(c);
 }
}
