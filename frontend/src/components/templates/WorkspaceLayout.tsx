import type { ReactNode } from "react";
import { Sidebar } from "../organisms/Sidebar";
import { AppHeader } from "../organisms/AppHeader";
export function WorkspaceLayout({
  children,
  notice,
}: {
  children: ReactNode;
  notice?: ReactNode;
}) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="workspace">
        <AppHeader />
        <main>
          {notice}
          {children}
        </main>
      </div>
    </div>
  );
}
