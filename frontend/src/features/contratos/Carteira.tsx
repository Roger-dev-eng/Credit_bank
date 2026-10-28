import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../components/atoms/Button";
import { PageHeading } from "../../components/molecules/PageHeading";
import { SearchField } from "../../components/molecules/SearchField";
import { ListaContratos } from "../../components/organisms/ContractList";
import { Carregando, Erro } from "../../components/molecules/Feedback";
import { api } from "../../services/api";
import type { Extrato } from "../../types";
import { statusLabel } from "../../utils/format";
const normalizar = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR");
export function Carteira() {
  const [busca, setBusca] = useState("");
  const contratos = useQuery({
    queryKey: ["contratos"],
    queryFn: () => api<Extrato[]>("/api/contratos"),
  });
  const termos = normalizar(busca).trim().split(/\s+/).filter(Boolean);
  const filtrados = (contratos.data || []).filter((c) => {
    const texto = normalizar(
      [
        c.contrato.cliente_nome || "",
        c.contrato.cliente_id,
        c.contrato.id,
        c.contrato.modalidade.replaceAll("_", " "),
        statusLabel[c.status] || c.status,
      ].join(" "),
    );
    return termos.every((termo) => texto.includes(termo));
  });
  return (
    <>
      <PageHeading
        title="Contratos"
        eyebrow="ACOMPANHAMENTO"
        description="Operações confirmadas e seus saldos atuais."
        actions={
          <Button asChild>
            <Link to="/simulador">
              <Plus size={16} />
              Simular operação
            </Link>
          </Button>
        }
      />
      <div className="contract-search">
        <SearchField
          label="Pesquisar contratos"
          placeholder="Nome do cliente, identificador, modalidade ou status…"
          value={busca}
          onChange={setBusca}
        />
        {contratos.data && (
          <p role="status" className="muted">
            {filtrados.length} de {contratos.data.length} contrato(s)
          </p>
        )}
      </div>
      <Erro error={contratos.error} />
      {contratos.isPending ? (
        <Carregando />
      ) : (
        !contratos.error && (
          <ListaContratos contratos={filtrados} filtrando={termos.length > 0} />
        )
      )}
    </>
  );
}
