export type ContaStatus = 'pendente' | 'pago' | 'vencido' | 'cancelado';

export type FormaPagamento =
  | 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'dinheiro' | 'transferencia' | 'stripe';

export type PagarCategoria =
  | 'fornecedor' | 'laboratorio' | 'aluguel' | 'salarios' | 'impostos'
  | 'materiais' | 'equipamentos' | 'marketing' | 'servicos' | 'outros';

export interface ContaReceber {
  id: string;
  codigo: string;
  paciente_id: string | null;
  orcamento_id: string | null;
  descricao: string;
  parcela_num: number;
  parcela_total: number;
  valor: number;
  vencimento: string;
  status: ContaStatus;
  forma_pagamento: FormaPagamento | null;
  pago_em: string | null;
  valor_pago: number | null;
  vindi_bill_id: string | null;
  vindi_charge_id: string | null;
  vindi_url: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  observacoes: string | null;
  criado_por: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContaReceberComPaciente extends ContaReceber {
  pacientes: { nome: string; cpf: string | null; email: string | null; telefone: string | null } | null;
  orcamentos: { codigo: string } | null;
}

export interface ContaPagar {
  id: string;
  descricao: string;
  categoria: PagarCategoria;
  fornecedor: string | null;
  valor: number;
  vencimento: string;
  status: ContaStatus;
  pago_em: string | null;
  valor_pago: number | null;
  forma_pagamento: string | null;
  recorrente: boolean;
  observacoes: string | null;
  criado_por: string | null;
  created_at: string;
  updated_at: string;
}

export const CONTA_STATUS_CONFIG: Record<ContaStatus, { label: string; color: string; bg: string; border: string }> = {
  pendente:  { label: 'Pendente',  color: '#C98A1E', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)' },
  pago:      { label: 'Pago',      color: '#1F7A4D', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)' },
  vencido:   { label: 'Vencido',   color: '#C0392B', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
  cancelado: { label: 'Cancelado', color: '#6B6B66', bg: 'rgba(138,138,147,0.08)', border: 'rgba(138,138,147,0.15)' },
};

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  pix:             'PIX',
  cartao_credito:  'Cartão de Crédito',
  cartao_debito:   'Cartão de Débito',
  boleto:          'Boleto',
  dinheiro:        'Dinheiro',
  transferencia:   'Transferência',
  stripe:          'Stripe (online)',
};

export const PAGAR_CATEGORIA_LABELS: Record<PagarCategoria, string> = {
  fornecedor:   'Fornecedor',
  laboratorio:  'Laboratório',
  aluguel:      'Aluguel',
  salarios:     'Salários',
  impostos:     'Impostos',
  materiais:    'Materiais',
  equipamentos: 'Equipamentos',
  marketing:    'Marketing',
  servicos:     'Serviços',
  outros:       'Outros',
};

export function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
