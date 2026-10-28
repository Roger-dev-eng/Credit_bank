package app.credito.cliente;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, String> {
  List<Cliente> findByNomeContainingIgnoreCaseOrderByNomeAsc(String nome);
}
