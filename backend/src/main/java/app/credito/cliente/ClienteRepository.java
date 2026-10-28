package app.credito.cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ClienteRepository extends JpaRepository<Cliente,String> {
 List<Cliente> findByNomeContainingIgnoreCaseOrderByNomeAsc(String nome);
}
