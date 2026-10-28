package app.credito.cliente;

import jakarta.persistence.*;

@Entity
@Table(name = "clientes")
public class Cliente {

  @Id
  public String id;

  public String nome;
  public String telefone;
  public String observacoes;

  @Column(name = "criado_em")
  public String criadoEm;

  @Column(name = "atualizado_em")
  public String atualizadoEm;

  public Cliente() {}
}
