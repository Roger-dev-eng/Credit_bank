import { Landmark } from "lucide-react";
function Erro({ error }: { error: unknown }) {
  return error ? (
    <div role="alert" className="error">
      {error instanceof Error
        ? error.message
        : "Não foi possível carregar os dados."}
    </div>
  ) : null;
}
function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <div className="empty">
      <Landmark size={34} />
      <p>{children}</p>
    </div>
  );
}
function Carregando() {
  return (
    <p role="status" className="muted">
      Carregando dados…
    </p>
  );
}

export { Carregando, Erro, Vazio };
