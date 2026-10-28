import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/atoms/Button";
import { api, baixar } from "../services/api";
import { hoje } from "../utils/format";

import { Erro } from "../components/molecules/Feedback";
function Configuracoes() {
  const [erro, setErro] = useState<unknown>(null);
  const [mensagem, setMensagem] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const q = useQueryClient();
  const restore = useMutation({
    mutationFn: async () => {
      if (!arquivo) throw new Error("Selecione um arquivo.");
      const bytes = Array.from(new Uint8Array(await arquivo.arrayBuffer()));
      return api("/api/backups/restaurar", "POST", { conteudo: bytes });
    },
    onSuccess: () => {
      q.invalidateQueries();
      setMensagem(
        "Backup restaurado. Uma cópia de segurança anterior à restauração foi preservada.",
      );
      setArquivo(null);
    },
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Dados e segurança</h1>
          <p className="muted">Backups do banco SQLite local.</p>
        </div>
      </div>
      <section className="card">
        <h2>Cópia de segurança</h2>
        <p>
          Exporte uma cópia consistente com clientes, contratos e histórico
          financeiro.
        </p>
        <Erro error={erro} />
        <Button
          onClick={() =>
            baixar("/api/backups", "gestao-credito-" + hoje() + ".db").catch(
              setErro,
            )
          }
        >
          <Download size={16} />
          Exportar backup
        </Button>
      </section>
      <section className="card">
        <h2>Restaurar backup</h2>
        <p>
          Esta operação substitui os dados atuais. O sistema preserva uma cópia
          anterior à restauração.
        </p>
        <input
          aria-label="Selecionar backup"
          type="file"
          accept=".db"
          onChange={(e) => setArquivo(e.target.files?.[0] || null)}
        />
        {arquivo && <p>Arquivo selecionado: {arquivo.name}</p>}
        <Erro error={restore.error} />
        <Button
          variant="destructive"
          disabled={!arquivo || restore.isPending}
          onClick={() => {
            if (
              window.confirm(
                "Substituir os dados atuais pelo backup selecionado?",
              )
            )
              restore.mutate();
          }}
        >
          Restaurar banco
        </Button>
        {mensagem && <p role="status">{mensagem}</p>}
      </section>
    </>
  );
}

export { Configuracoes };
