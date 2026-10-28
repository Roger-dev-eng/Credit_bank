package app.credito.shared;

public class NaoEncontrado extends RuntimeException {

  public NaoEncontrado() {
    super("Registro não encontrado.");
  }
}
