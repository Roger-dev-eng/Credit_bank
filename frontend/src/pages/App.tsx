import { Route, Routes } from "react-router-dom";
import { WorkspaceLayout } from "../components/templates/WorkspaceLayout";
import { Clientes, DetalheCliente } from "../features/clientes/Clientes";
import { Carteira } from "../features/contratos/Carteira";
import { DetalheContrato } from "../features/contratos/DetalheContrato";
import { Simulador } from "../features/simulacao/Simulador";
import { AvisoAtualizacao } from "../features/atualizacoes/Atualizacoes";
import { Configuracoes } from "./Configuracoes";
import { Atualizacoes } from "./Atualizacoes";
export default function App() {
  return (
    <WorkspaceLayout notice={<AvisoAtualizacao />}>
      <Routes>
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/:id" element={<DetalheCliente />} />
        <Route path="/simulador" element={<Simulador />} />
        <Route path="/contratos" element={<Carteira />} />
        <Route path="/contratos/:id" element={<DetalheContrato />} />
        <Route path="/atualizacoes" element={<Atualizacoes />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="*" element={<Clientes />} />
      </Routes>
    </WorkspaceLayout>
  );
}
