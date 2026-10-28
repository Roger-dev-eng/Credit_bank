import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Modal } from "../../components/molecules/Modal";
import { Button } from "../../components/atoms/Button";
import { api } from "../../services/api";
import type { Cliente, Extrato } from "../../types";
import { dinheiro } from "../../utils/format";

import { Carregando, Erro, Vazio } from "../../components/molecules/Feedback";
import { ListaContratos } from "../../components/organisms/ContractList";
const clienteSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome.").max(150),
  telefone: z.string().max(40),
  observacoes: z.string().max(4000),
});
type ClienteForm = z.infer<typeof clienteSchema>;
function Clientes() {
  const [busca, setBusca] = useState("");
  const [editor, setEditor] = useState<Cliente | null | undefined>();
  const [excluir, setExcluir] = useState<Cliente | null>(null);
  const q = useQueryClient();
  const clientes = useQuery({
    queryKey: ["clientes", busca],
    queryFn: () =>
      api<Cliente[]>("/api/clientes?busca=" + encodeURIComponent(busca)),
  });
  const apagar = useMutation({
    mutationFn: (id: string) => api("/api/clientes/" + id, "DELETE"),
    onSuccess: () => {
      setExcluir(null);
      q.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">RELACIONAMENTO</span>
          <h1>Clientes</h1>
          <p className="muted">Pessoas e operações, em um só lugar.</p>
        </div>
        <Button onClick={() => setEditor(null)}>
          <Plus size={16} />
          Novo cliente
        </Button>
      </div>
      <section className="card">
        <input
          aria-label="Pesquisar por nome"
          placeholder="Pesquisar por nome…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        {clientes.isPending ? <Carregando /> : null}
        <Erro error={clientes.error} />
        {clientes.data?.length === 0 ? (
          <Vazio>
            Nenhum cliente cadastrado. Comece adicionando seu primeiro cliente.
          </Vazio>
        ) : null}
        <div className="client-list">
          {clientes.data?.map((c) => (
            <article className="client-row" key={c.id}>
              <div className="avatar">{c.nome.slice(0, 2).toUpperCase()}</div>
              <Link className="client-identity" to={"/clientes/" + c.id}>
                <strong>{c.nome}</strong>
                <small>{c.telefone || "Sem telefone informado"}</small>
              </Link>
              <div className="actions">
                <Button variant="outline" onClick={() => setEditor(c)}>
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    apagar.reset();
                    setExcluir(c);
                  }}
                >
                  Excluir
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
      {editor !== undefined && (
        <ClienteEditor cliente={editor} onClose={() => setEditor(undefined)} />
      )}
      {excluir && (
        <Modal title="Excluir cliente" onClose={() => setExcluir(null)}>
          <p>
            Excluir {excluir.nome}? Clientes com contratos vinculados não podem
            ser excluídos.
          </p>
          <Erro error={apagar.error} />
          <div className="actions end">
            <Button variant="outline" onClick={() => setExcluir(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={apagar.isPending}
              onClick={() => apagar.mutate(excluir.id)}
            >
              Confirmar exclusão
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
function ClienteEditor({
  cliente,
  onClose,
}: {
  cliente: Cliente | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const q = useQueryClient();
  const form = useForm<ClienteForm>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: cliente?.nome || "",
      telefone: cliente?.telefone || "",
      observacoes: cliente?.observacoes || "",
    },
  });
  const salvar = useMutation({
    mutationFn: (v: ClienteForm) =>
      api<Cliente>(
        "/api/clientes" + (cliente ? "/" + cliente.id : ""),
        cliente ? "PUT" : "POST",
        v,
      ),
    onSuccess: (salvo) => {
      q.invalidateQueries({ queryKey: ["clientes"] });
      q.invalidateQueries({ queryKey: ["cliente"] });
      onClose();
      if (!cliente)
        navigate("/simulador?cliente=" + encodeURIComponent(salvo.id));
    },
  });
  return (
    <Modal
      title={cliente ? "Editar cliente" : "Novo cliente"}
      onClose={onClose}
    >
      <form onSubmit={form.handleSubmit((v) => salvar.mutate(v))}>
        <label>
          Nome
          <input {...form.register("nome")} autoFocus />
        </label>
        <Erro
          error={
            form.formState.errors.nome
              ? new Error(form.formState.errors.nome.message)
              : null
          }
        />
        <label>
          Telefone (opcional)
          <input {...form.register("telefone")} />
        </label>
        <label>
          Observações (opcional)
          <textarea {...form.register("observacoes")} />
        </label>
        <Erro error={salvar.error} />
        <Button disabled={salvar.isPending}>Salvar cliente</Button>
      </form>
    </Modal>
  );
}
function DetalheCliente() {
  const { id } = useParams();
  const c = useQuery({
    queryKey: ["cliente", id],
    queryFn: () => api<Cliente>("/api/clientes/" + id),
  });
  const contratos = useQuery({
    queryKey: ["contratos", id],
    queryFn: () => api<Extrato[]>("/api/contratos?clienteId=" + id),
  });
  return (
    <>
      <Link className="back" to="/clientes">
        <ArrowLeft size={15} />
        Clientes
      </Link>
      <div className="page-heading">
        <div>
          <h1>{c.data?.nome || "Cliente"}</h1>
          <p className="muted">
            {c.data?.telefone} {c.data?.observacoes}
          </p>
        </div>
        <Button asChild>
          <Link to={"/simulador?cliente=" + id}>Nova operação</Link>
        </Button>
      </div>
      <Erro error={c.error || contratos.error} />
      {contratos.data && (
        <section className="card">
          <h2>Resumo financeiro</h2>
          <div className="stats">
            {(["original", "recebido", "saldo", "atraso"] as const).map(
              (key, i) => (
                <div className="stat" key={key}>
                  <span>
                    {
                      [
                        "Valor contratado",
                        "Recebido",
                        "Saldo pendente",
                        "Em atraso",
                      ][i]
                    }
                  </span>
                  <strong>
                    {dinheiro(
                      contratos.data.reduce(
                        (total, c) => total + c.indicadores[key],
                        0,
                      ),
                    )}
                  </strong>
                </div>
              ),
            )}
          </div>
        </section>
      )}
      <ListaContratos contratos={contratos.data || []} />
    </>
  );
}

export { Clientes, DetalheCliente };
