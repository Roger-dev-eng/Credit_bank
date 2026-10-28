import type { Extrato } from "../../types";
import { Card } from "../atoms/Card";
import { Vazio } from "../molecules/Feedback";
import { ContractRow } from "../molecules/ContractRow";
export function ListaContratos({
  contratos,
  filtrando = false,
}: {
  contratos: Extrato[];
  filtrando?: boolean;
}) {
  return (
    <Card>
      {contratos.length === 0 ? (
        <Vazio>
          {filtrando
            ? "Nenhum contrato encontrado para esta pesquisa."
            : "Nenhum contrato confirmado."}
        </Vazio>
      ) : (
        <div className="contract-list">
          {contratos.map((c) => (
            <ContractRow key={c.contrato.id} contrato={c} />
          ))}
        </div>
      )}
    </Card>
  );
}
