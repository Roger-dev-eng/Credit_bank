import { PageHeading } from "../components/molecules/PageHeading";
import { PainelAtualizacao } from "../features/atualizacoes/Atualizacoes";
export function Atualizacoes() {
  return (
    <>
      <PageHeading
        title="Atualizações"
        eyebrow="SISTEMA"
        description="Novas versões, melhorias e segurança para seu aplicativo."
      />
      <PainelAtualizacao />
    </>
  );
}
