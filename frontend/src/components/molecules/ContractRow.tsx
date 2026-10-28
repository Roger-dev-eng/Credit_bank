import { Link } from "react-router-dom";
import type { Extrato } from "../../types";
import { dinheiro } from "../../utils/format";
import { StatusBadge } from "../atoms/StatusBadge";
import { UserRound, ChevronRight } from "lucide-react";
export function ContractRow({ contrato: c }: { contrato: Extrato }) {
  return (
    <Link className="contract-row" to={"/contratos/" + c.contrato.id}>
      <div className="contract-main">
        <span className="eyebrow">
          {c.contrato.modalidade === "PARCELA_FIXA"
            ? "PARCELA FIXA"
            : "SÓ JUROS"}
        </span>
        <span className="contract-client">
          <UserRound size={15} aria-hidden="true" />
          <strong>
            {c.contrato.cliente_nome ||
              "Cliente " + c.contrato.cliente_id.slice(0, 8)}
          </strong>
        </span>
        <small className="contract-reference" title={c.contrato.id}>
          Contrato {c.contrato.id.slice(0, 8)} · {c.contrato.prazo} meses ·{" "}
          {c.contrato.taxa}% a.m.
        </small>
      </div>
      <div className="contract-balance">
        <small>Saldo pendente</small>
        <strong>{dinheiro(c.indicadores.saldo)}</strong>
        <StatusBadge status={c.status} />
      </div>
      <ChevronRight className="contract-chevron" size={18} aria-hidden="true" />
    </Link>
  );
}
