import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { api } from "../../services/api";
import type { Extrato } from "../../types";
import { dinheiro, statusLabel } from "../../utils/format";

import { Carregando, Erro, Vazio } from "../../components/Feedback";
function Carteira() {
  const contratos = useQuery({
    queryKey: ["contratos"],
    queryFn: () => api<Extrato[]>("/api/contratos"),
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ACOMPANHAMENTO</span>
          <h1>Contratos</h1>
          <p className="muted">Operações confirmadas e seus saldos atuais.</p>
        </div>
        <Button asChild>
          <Link to="/simulador">
            <Plus size={16} />
            Simular operação
          </Link>
        </Button>
      </div>
      <Erro error={contratos.error} />
      {contratos.isPending && <Carregando />}
      <ListaContratos contratos={contratos.data || []} />
    </>
  );
}
function ListaContratos({ contratos }: { contratos: Extrato[] }) {
  return (
    <section className="card">
      {contratos.length === 0 ? (
        <Vazio>Nenhum contrato confirmado.</Vazio>
      ) : (
        <div className="contract-list">
          {contratos.map((c) => (
            <Link
              className="contract-row"
              key={c.contrato.id}
              to={"/contratos/" + c.contrato.id}
            >
              <div>
                <span className="eyebrow">
                  {c.contrato.modalidade === "PARCELA_FIXA"
                    ? "PARCELA FIXA"
                    : "SÓ JUROS"}
                </span>
                <strong>Contrato {c.contrato.id.slice(0, 8)}</strong>
                <small>
                  {c.contrato.prazo} meses · {c.contrato.taxa}% a.m.
                </small>
              </div>
              <div>
                <small>Saldo pendente</small>
                <strong>{dinheiro(c.indicadores.saldo)}</strong>
                <span className={"badge " + c.status}>
                  {statusLabel[c.status]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export { Carteira, ListaContratos };
