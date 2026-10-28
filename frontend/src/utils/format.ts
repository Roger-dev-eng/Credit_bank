export const dinheiro = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v,
  );
export const data = (v: string) =>
  new Date(v + "T12:00:00").toLocaleDateString("pt-BR");
export const hoje = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const statusLabel: Record<string, string> = {
  A_PAGAR: "A pagar",
  PAGO: "Pago",
  PARCIALMENTE_PAGO: "Parcialmente pago",
  EM_ATRASO: "Em atraso",
  ANTECIPADO: "Antecipado",
  CANCELADO: "Cancelado",
  ATIVO: "Ativo",
  QUITADO: "Quitado",
};
