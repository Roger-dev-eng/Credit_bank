import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Cronograma, IndicadoresCards } from "../../components/Financeiro";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/ui/button";
import { api, baixar } from "../../services/api";
import type {
  Antecipacao,
  Cliente,
  Extrato,
  Parcela,
  Previa,
} from "../../types";
import { data, dinheiro, hoje, statusLabel } from "../../utils/format";

import { Carregando, Erro, Vazio } from "../../components/Feedback";
function DetalheContrato() {
  const { id } = useParams();
  const q = useQueryClient();
  const [receber, setReceber] = useState<Parcela | null>(null);
  const [ant, setAnt] = useState(false);
  const [estorno, setEstorno] = useState<string | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const c = useQuery({
    queryKey: ["contrato", id],
    queryFn: () => api<Extrato>("/api/contratos/" + id),
  });
  const cliente = useQuery({
    queryKey: ["cliente", c.data?.contrato.cliente_id],
    enabled: !!c.data,
    queryFn: () => api<Cliente>("/api/clientes/" + c.data!.contrato.cliente_id),
  });
  const historico = useQuery({
    queryKey: ["historico", id, c.dataUpdatedAt],
    queryFn: () =>
      api<
        { id: string; operacao: string; detalhes: string; criado_em: string }[]
      >("/api/contratos/" + id + "/historico"),
  });
  function refresh() {
    q.invalidateQueries({ queryKey: ["contrato", id] });
    q.invalidateQueries({ queryKey: ["contratos"] });
  }
  if (!c.data)
    return (
      <>
        <Erro error={c.error} />
        {c.isPending && <Carregando />}
      </>
    );
  const x = c.data;
  return (
    <>
      <Link className="back" to="/contratos">
        <ArrowLeft size={15} />
        Contratos
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {x.contrato.modalidade === "PARCELA_FIXA"
              ? "PARCELA FIXA"
              : "SÓ JUROS"}
          </span>
          <h1>{cliente.data?.nome || "Contrato"}</h1>
          <p className="muted">
            Contrato {id?.slice(0, 8)} · {x.contrato.taxa}% ao mês ·{" "}
            <span className={"badge " + x.status}>{statusLabel[x.status]}</span>
          </p>
        </div>
        <div className="actions no-print">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer size={16} />
            Imprimir
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              baixar(
                "/api/contratos/" + id + "/pdf",
                "extrato-" + id?.slice(0, 8) + ".pdf",
              ).catch(setErro)
            }
          >
            <Download size={16} />
            PDF
          </Button>
          <Button
            disabled={x.status === "QUITADO"}
            onClick={() => setAnt(true)}
          >
            Antecipação
          </Button>
        </div>
      </div>
      <Erro error={erro} />
      <IndicadoresCards value={x.indicadores} />
      <section className="card">
        <h2>Cronograma de vencimentos</h2>
        <Cronograma parcelas={x.parcelas} onReceber={setReceber} />
      </section>
      <section className="card">
        <h2>Histórico de pagamentos</h2>
        {x.pagamentos.length === 0 ? (
          <Vazio>Nenhum recebimento registrado.</Vazio>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data efetiva</th>
                  <th>Valor</th>
                  <th>Forma</th>
                  <th>Observação</th>
                  <th>Situação</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {x.pagamentos.map((p) => (
                  <tr key={p.id}>
                    <td>{data(p.data_efetiva)}</td>
                    <td>{dinheiro(p.valor_centavos / 100)}</td>
                    <td>{p.forma || "—"}</td>
                    <td>{p.observacao || p.justificativa || "—"}</td>
                    <td>{p.estornado_em ? "Estornado" : "Registrado"}</td>
                    <td>
                      {!p.estornado_em && (
                        <Button
                          variant="destructive"
                          onClick={() => setEstorno(p.id)}
                        >
                          Estornar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="card">
        <h2>Histórico de operações</h2>
        {historico.data?.map((h) => (
          <p key={h.id} className="muted">
            {new Date(h.criado_em).toLocaleString("pt-BR")} · {h.operacao}
          </p>
        ))}
      </section>
      <p className="muted">
        Extrato emitido em {new Date(x.emitidoEm).toLocaleString("pt-BR")}.
        Valores calculados a partir do histórico persistido.
      </p>
      {receber && (
        <PagamentoModal
          parcela={receber}
          onClose={() => setReceber(null)}
          onSuccess={() => {
            setReceber(null);
            refresh();
          }}
        />
      )}
      {ant && (
        <AntecipacaoModal
          contrato={x}
          onClose={() => setAnt(false)}
          onSuccess={() => {
            setAnt(false);
            refresh();
          }}
        />
      )}
      {estorno && (
        <EstornoModal
          id={estorno}
          onClose={() => setEstorno(null)}
          onSuccess={() => {
            setEstorno(null);
            refresh();
          }}
        />
      )}
    </>
  );
}
function PagamentoModal({
  parcela,
  onClose,
  onSuccess,
}: {
  parcela: Parcela;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [chave] = useState(() => crypto.randomUUID());
  const m = useMutation({
    mutationFn: (body: unknown) => api("/api/pagamentos", "POST", body),
    onSuccess,
  });
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    m.mutate({
      parcelaId: parcela.id,
      valor: Number(f.get("valor")),
      data: f.get("data"),
      forma: f.get("forma"),
      observacao: f.get("observacao"),
      chave,
    });
  }
  return (
    <Modal title={"Receber parcela " + parcela.numero} onClose={onClose}>
      <p>
        Saldo atual: <strong>{dinheiro(parcela.saldo)}</strong>. O valor
        permitido será validado na data efetiva.
      </p>
      <form onSubmit={submit}>
        <label>
          Valor recebido (R$)
          <input
            name="valor"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={parcela.saldo}
            required
          />
        </label>
        <label>
          Data efetiva
          <input
            name="data"
            type="date"
            defaultValue={hoje()}
            max={hoje()}
            required
          />
        </label>
        <label>
          Forma de pagamento (opcional)
          <input name="forma" maxLength={80} />
        </label>
        <label>
          Observação (opcional)
          <textarea name="observacao" maxLength={2000} />
        </label>
        <p className="muted">Aplicação: multa → mora → juros → principal.</p>
        <Erro error={m.error} />
        <Button disabled={m.isPending}>Registrar recebimento</Button>
      </form>
    </Modal>
  );
}
function EstornoModal({
  id,
  onClose,
  onSuccess,
}: {
  id: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const m = useMutation({
    mutationFn: (justificativa: string) =>
      api("/api/pagamentos/" + id + "/estorno", "POST", { justificativa }),
    onSuccess,
  });
  return (
    <Modal title="Estornar pagamento" onClose={onClose}>
      <p>
        O pagamento será preservado no histórico, e o saldo será recalculado.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          m.mutate(String(new FormData(e.currentTarget).get("justificativa")));
        }}
      >
        <label>
          Justificativa
          <textarea name="justificativa" required maxLength={2000} />
        </label>
        <Erro error={m.error} />
        <Button variant="destructive" disabled={m.isPending}>
          Confirmar estorno
        </Button>
      </form>
    </Modal>
  );
}
function AntecipacaoModal({
  contrato,
  onClose,
  onSuccess,
}: {
  contrato: Extrato;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [entrada, setEntrada] = useState<Antecipacao | null>(null);
  const previa = useMutation({
    mutationFn: (v: Antecipacao) =>
      api<Previa>("/api/antecipacoes/previa", "POST", v),
  });
  const confirmar = useMutation({
    mutationFn: () => api("/api/antecipacoes", "POST", entrada),
    onSuccess,
  });
  const fixa = contrato.contrato.modalidade === "PARCELA_FIXA";
  return (
    <Modal
      title={fixa ? "Antecipar pagamento" : "Antecipar mês de quitação"}
      onClose={onClose}
    >
      <p>
        {fixa
          ? "O valor recebido será aplicado nas últimas parcelas, sem desconto de juros."
          : "O principal será transferido para o mês escolhido e os juros posteriores serão eliminados. Essa alteração não registra um recebimento."}
      </p>
      <form
        onChange={() => {
          previa.reset();
          setEntrada(null);
        }}
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const v: Antecipacao = {
            contratoId: contrato.contrato.id,
            data: String(f.get("data")),
            chave: crypto.randomUUID(),
            ...(fixa
              ? { valor: Number(f.get("valor")) }
              : { novoMes: Number(f.get("novoMes")) }),
          };
          setEntrada(v);
          previa.mutate(v);
        }}
      >
        <label>
          {fixa ? "Valor recebido (R$)" : "Novo mês de quitação"}
          <input
            type="number"
            name={fixa ? "valor" : "novoMes"}
            min={fixa ? "0.01" : "1"}
            step={fixa ? "0.01" : "1"}
            required
          />
        </label>
        <label>
          Data efetiva
          <input
            name="data"
            type="date"
            defaultValue={hoje()}
            max={hoje()}
            required
          />
        </label>
        <Erro error={previa.error} />
        <Button variant="outline" disabled={previa.isPending}>
          Calcular prévia
        </Button>
      </form>
      {previa.data && (
        <div className="preview">
          <h3>Prévia</h3>
          {previa.data.alocacoes.map((a) => (
            <p key={a.parcelaId}>
              Parcela {a.numero}: {dinheiro(a.valor)}
            </p>
          ))}
          <p>Recebimento: {dinheiro(previa.data.recebido)}</p>
          <p>Juros eliminados: {dinheiro(previa.data.jurosEliminados)}</p>
          <Erro error={confirmar.error} />
          <Button
            disabled={confirmar.isPending || !entrada}
            onClick={() => confirmar.mutate()}
          >
            Confirmar antecipação
          </Button>
        </div>
      )}
    </Modal>
  );
}

export { DetalheContrato };
