import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Cronograma } from "../../components/Financeiro";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/ui/button";
import { api } from "../../services/api";
import type { Cliente, Entrada, Extrato, Simulacao } from "../../types";
import { dinheiro, hoje } from "../../utils/format";

import { Erro } from "../../components/Feedback";
const simulacaoSchema = z.object({
  modalidade: z.enum(["PARCELA_FIXA", "SO_JUROS"]),
  principal: z.coerce.number().positive().max(1000000000),
  taxa: z.coerce.number().min(0).max(100),
  prazo: z.coerce.number().int().min(1).max(600),
  primeiroVencimento: z.string().min(10),
  multa: z.coerce.number().min(0).max(100),
  mora: z.coerce.number().min(0).max(100),
  mesQuitacao: z.coerce.number().int().min(1).max(600),
  parcelaDesejada: z.string(),
});
type SimForm = z.infer<typeof simulacaoSchema>;
function Simulador() {
  const nav = useNavigate();
  const q = useQueryClient();
  const [porParcela, setPorParcela] = useState(false);
  const [cliente, setCliente] = useState(
    new URLSearchParams(location.hash.split("?")[1]).get("cliente") || "",
  );
  const [confirmar, setConfirmar] = useState(false);
  const cs = useQuery({
    queryKey: ["clientes", ""],
    queryFn: () => api<Cliente[]>("/api/clientes"),
  });
  const form = useForm<SimForm>({
    resolver: zodResolver(simulacaoSchema),
    defaultValues: {
      modalidade: "PARCELA_FIXA",
      taxa: 0,
      prazo: 12,
      mesQuitacao: 12,
      primeiroVencimento: hoje(),
      multa: 0,
      mora: 0,
      parcelaDesejada: "",
    },
  });
  const modo = form.watch("modalidade");
  const sim = useMutation({
    mutationFn: (e: Entrada) => api<Simulacao>("/api/simulacoes", "POST", e),
  });
  const criar = useMutation({
    mutationFn: () =>
      api<Extrato>("/api/contratos", "POST", {
        clienteId: cliente,
        simulacao: sim.data!.entrada,
      }),
    onSuccess: (x) => {
      q.invalidateQueries({ queryKey: ["contratos"] });
      nav("/contratos/" + x.contrato.id);
    },
  });
  const submit = form.handleSubmit((v) => {
    sim.mutate({
      ...v,
      parcelaDesejada:
        porParcela && modo === "PARCELA_FIXA"
          ? Number(v.parcelaDesejada)
          : undefined,
    });
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PLANEJAMENTO</span>
          <h1>Simular crédito</h1>
          <p className="muted">
            Explore as condições antes de confirmar um contrato.
          </p>
        </div>
      </div>
      <section className="card">
        <div className="segmented">
          {(["PARCELA_FIXA", "SO_JUROS"] as const).map((m) => (
            <button
              className={modo === m ? "selected" : ""}
              key={m}
              onClick={() => {
                form.setValue("modalidade", m);
                sim.reset();
              }}
            >
              {m === "PARCELA_FIXA" ? "Parcela fixa" : "Só juros"}
            </button>
          ))}
        </div>
        <form
          onSubmit={submit}
          onChange={() => {
            sim.reset();
            criar.reset();
          }}
        >
          <div className="form-grid">
            <label>
              Valor do empréstimo (R$)
              <input
                type="number"
                step="0.01"
                min="0.01"
                {...form.register("principal")}
              />
            </label>
            <label>
              Taxa mensal (%)
              <input type="number" step="0.000001" {...form.register("taxa")} />
            </label>
            <label>
              {modo === "SO_JUROS" ? "Horizonte (meses)" : "Número de parcelas"}
              <input
                type="number"
                {...form.register("prazo")}
                disabled={porParcela && modo === "PARCELA_FIXA"}
              />
            </label>
            {modo === "PARCELA_FIXA" ? (
              <label>
                Parcela desejada (R$)
                <input
                  type="number"
                  step="0.01"
                  disabled={!porParcela}
                  {...form.register("parcelaDesejada")}
                />
              </label>
            ) : (
              <label>
                Mês de quitação
                <input type="number" {...form.register("mesQuitacao")} />
              </label>
            )}
            <label>
              Primeiro vencimento
              <input type="date" {...form.register("primeiroVencimento")} />
            </label>
            <label>
              Multa (%)
              <input type="number" step="0.01" {...form.register("multa")} />
            </label>
            <label>
              Mora diária (%)
              <input type="number" step="0.000001" {...form.register("mora")} />
            </label>
          </div>
          {modo === "PARCELA_FIXA" && (
            <label className="checkbox">
              <input
                type="checkbox"
                checked={porParcela}
                onChange={(e) => setPorParcela(e.target.checked)}
              />
              Calcular prazo pela parcela desejada
            </label>
          )}
          <p className="muted">
            Juros sobre o principal original. O último vencimento absorve os
            centavos residuais.
          </p>
          {Object.keys(form.formState.errors).length > 0 && (
            <div role="alert" className="error">
              Revise os valores e as datas do formulário.
            </div>
          )}
          <Erro error={sim.error} />
          <Button disabled={sim.isPending}>
            <Calculator size={16} />
            Calcular simulação
          </Button>
        </form>
      </section>
      {sim.data && (
        <section className="card">
          <div className="section-heading">
            <h2>Resultado da simulação</h2>
            <span className="badge">Não confirmado</span>
          </div>
          <div className="stats">
            <div className="stat">
              <span>Primeira parcela</span>
              <strong>{dinheiro(sim.data.parcela)}</strong>
            </div>
            <div className="stat">
              <span>Total previsto</span>
              <strong>{dinheiro(sim.data.total)}</strong>
            </div>
            <div className="stat">
              <span>Juros totais</span>
              <strong>{dinheiro(sim.data.jurosTotais)}</strong>
            </div>
            <div className="stat">
              <span>Prazo calculado</span>
              <strong>{sim.data.prazo} meses</strong>
            </div>
          </div>
          <Cronograma parcelas={sim.data.parcelas} />
          <div className="confirm-contract">
            <label>
              Cliente responsável
              <select
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
              >
                <option value="">Selecione um cliente</option>
                {cs.data?.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
            <Button disabled={!cliente} onClick={() => setConfirmar(true)}>
              Confirmar contrato
            </Button>
          </div>
          {cs.data?.length === 0 && (
            <p className="muted">
              Cadastre um cliente para confirmar esta operação.
            </p>
          )}
        </section>
      )}
      {confirmar && sim.data && (
        <Modal title="Confirmar contrato" onClose={() => setConfirmar(false)}>
          <p>
            Confirmar {dinheiro(sim.data.entrada.principal)} para{" "}
            {cs.data?.find((c) => c.id === cliente)?.nome}, com total previsto
            de {dinheiro(sim.data.total)}?
          </p>
          <Erro error={criar.error} />
          <Button disabled={criar.isPending} onClick={() => criar.mutate()}>
            Criar contrato e parcelas
          </Button>
        </Modal>
      )}
    </>
  );
}

export { Simulador };
