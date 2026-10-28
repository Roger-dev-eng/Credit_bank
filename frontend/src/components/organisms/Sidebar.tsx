import {
  Calculator,
  Database,
  Files,
  Landmark,
  Users,
  RefreshCw,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { identidade } from "../../config";
const links = [
  { to: "/clientes", label: "Clientes", Icon: Users },
  { to: "/simulador", label: "Simulador", Icon: Calculator },
  { to: "/contratos", label: "Contratos", Icon: Files },
  { to: "/atualizacoes", label: "Atualizações", Icon: RefreshCw },
  { to: "/configuracoes", label: "Dados e segurança", Icon: Database },
];
export function Sidebar() {
  return (
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
      <nav aria-label="Menu principal">
        {links.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to}>
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span className="offline-dot" />
        Armazenamento local<small>Versão {identidade.versao}</small>
      </div>
    </aside>
  );
}
