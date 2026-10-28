import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./pages/App";
import { AtualizacoesProvider } from "./features/atualizacoes/Atualizacoes";
import { createQueryClient } from "./services/queryClient";
import "./styles.css";
const query = createQueryClient();
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={query}>
      <HashRouter>
        <AtualizacoesProvider>
          <App />
        </AtualizacoesProvider>
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
