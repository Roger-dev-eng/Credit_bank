export interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
  observacoes: string | null;
  criadoEm: string;
  atualizadoEm: string;
}
export type Modalidade = "PARCELA_FIXA" | "SO_JUROS";
export interface Entrada {
  modalidade: Modalidade;
  principal: number;
  taxa: number;
  prazo?: number;
  parcelaDesejada?: number;
  mesQuitacao?: number;
  primeiroVencimento: string;
  multa: number;
  mora: number;
}
export interface Linha {
  numero: number;
  vencimento: string;
  principal: number;
  juros: number;
  previsto: number;
}
export interface Simulacao {
  entrada: Entrada;
  prazo: number;
  mesQuitacao: number;
  parcela: number;
  jurosTotais: number;
  total: number;
  parcelas: Linha[];
}
export interface Parcela extends Linha {
  id: string;
  recebido: number;
  multa: number;
  mora: number;
  saldo: number;
  principalPendente: number;
  jurosPendentes: number;
  status: string;
}
export interface Indicadores {
  original: number;
  previsto: number;
  principalDevido: number;
  jurosFuturos: number;
  encargos: number;
  recebido: number;
  atraso: number;
  saldo: number;
  pagas: number;
  pendentes: number;
}
export interface Pagamento {
  id: string;
  parcela_id: string;
  valor_centavos: number;
  data_efetiva: string;
  forma: string | null;
  observacao: string | null;
  estornado_em: string | null;
  justificativa: string | null;
}
export interface Extrato {
  contrato: {
    id: string;
    cliente_id: string;
    cliente_nome: string;
    modalidade: Modalidade;
    criado_em: string;
    taxa: string;
    prazo: number;
    mes_quitacao: number;
  };
  parcelas: Parcela[];
  pagamentos: Pagamento[];
  antecipacoes: unknown[];
  indicadores: Indicadores;
  status: string;
  emitidoEm: string;
}
export interface Antecipacao {
  contratoId: string;
  valor?: number;
  novoMes?: number;
  data: string;
  chave: string;
}
export interface Previa {
  alocacoes: { parcelaId: string; numero: number; valor: number }[];
  recebido: number;
  jurosEliminados: number;
  novoMes: number | null;
}
