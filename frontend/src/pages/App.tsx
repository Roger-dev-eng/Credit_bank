import { Calculator, Database, Files, Landmark, Users } from "lucide-react";
import { NavLink, Route, Routes } from "react-router-dom";
import { identidade } from "../config";

import { Clientes, DetalheCliente } from "../features/clientes/Clientes";
import { Carteira } from "../features/contratos/Carteira";
import { DetalheContrato } from "../features/contratos/DetalheContrato";
import { Simulador } from "../features/simulacao/Simulador";
import { Configuracoes } from "./Configuracoes";
export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Landmark size={24} />
          </div>
          <div>
            <strong>{identidade.titulo}</strong>
            <small>{identidade.subtitulo}</small>
          </div>
        </div>
        <div className="nav-caption">ESPAÇO DE TRABALHO</div>
        <nav>
          <NavLink to="/clientes">
            <Users size={19} />
            Clientes
          </NavLink>
          <NavLink to="/simulador">
            <Calculator size={19} />
            Simulador
          </NavLink>
          <NavLink to="/contratos">
            <Files size={19} />
            Contratos
          </NavLink>
          <NavLink to="/configuracoes">
            <Database size={19} />
            Dados e segurança
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <span className="offline-dot" />
          Armazenamento local<small>Versão {identidade.versao}</small>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>Operações de crédito</span>
          <span className="badge">Uso local · BRL</span>
        </header>
        <main>
          <Routes>
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/clientes/:id" element={<DetalheCliente />} />
            <Route path="/simulador" element={<Simulador />} />
            <Route path="/contratos" element={<Carteira />} />
            <Route path="/contratos/:id" element={<DetalheContrato />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="*" element={<Clientes />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
