import type { Indicadores, Linha, Parcela } from "../types";
import { data, dinheiro, statusLabel } from "../utils/format";
import { Button } from "./ui/button";
export function IndicadoresCards({ value: i }: { value: Indicadores }) {
  const cards: [string, number, string][] = [
    ["Valor contratado", i.original, ""],
    ["Total previsto", i.previsto, ""],
    ["Principal devido", i.principalDevido, ""],
    ["Juros futuros", i.jurosFuturos, ""],
    ["Encargos pendentes", i.encargos, "danger"],
    ["Efetivamente recebido", i.recebido, "success"],
    ["Em atraso", i.atraso, "danger"],
    ["Saldo pendente", i.saldo, "accent"],
  ];
  return (
    <>
      <div className="stats">
        {cards.map(([label, v, tone]) => (
          <article className={"stat " + tone} key={label}>
            <span>{label}</span>
            <strong>{dinheiro(v)}</strong>
          </article>
        ))}
      </div>
      <p className="muted">
        {i.pagas} parcela(s) quitada(s) · {i.pendentes} pendente(s)
      </p>
    </>
  );
}
export function Cronograma({
  parcelas,
  onReceber,
}: {
  parcelas: (Linha | Parcela)[];
  onReceber?: (p: Parcela) => void;
}) {
  return (
    <>
      <div className="timeline" aria-label="Linha do tempo">
        {parcelas.map((p) => (
          <span
            title={data(p.vencimento)}
            className={"badge " + ("status" in p ? p.status : "A_PAGAR")}
            key={p.numero}
          >
            {p.numero}
          </span>
        ))}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Vencimento</th>
              <th>Principal</th>
              <th>Juros</th>
              <th>Previsto</th>
              {onReceber && (
                <>
                  <th>Recebido</th>
                  <th>Multa</th>
                  <th>Mora</th>
                  <th>Saldo</th>
                  <th>Status</th>
                  <th />
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {parcelas.map((p) => (
              <tr key={p.numero}>
                <td>{p.numero}</td>
                <td>{data(p.vencimento)}</td>
                <td>{dinheiro(p.principal)}</td>
                <td>{dinheiro(p.juros)}</td>
                <td>{dinheiro(p.previsto)}</td>
                {onReceber && "status" in p && (
                  <>
                    <td>{dinheiro(p.recebido)}</td>
                    <td>{dinheiro(p.multa)}</td>
                    <td>{dinheiro(p.mora)}</td>
                    <td>
                      <strong>{dinheiro(p.saldo)}</strong>
                    </td>
                    <td>
                      <span className={"badge " + p.status}>
                        {statusLabel[p.status]}
                      </span>
                    </td>
                    <td>
                      {p.saldo > 0 && (
                        <Button variant="outline" onClick={() => onReceber(p)}>
                          Receber
                        </Button>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
