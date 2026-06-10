export type OrcamentoStatus = 'rascunho' | 'enviado' | 'negociacao' | 'aprovado' | 'recusado' | 'expirado';
export type DescontoTipo = 'percentual' | 'valor';
export type ProcedimentoCategoria =
  | 'dentistica' | 'endo' | 'perio' | 'cirurgia'
  | 'protese' | 'ortodontia' | 'estetica' | 'prevencao';

export interface ProcedimentoTabela {
  id: string;
  codigo: string | null;
  nome: string;
  categoria: ProcedimentoCategoria;
  valor_base: number;
  custo_estimado: number | null;
  duracao_min: number;
  ativo: boolean;
  created_at: string;
}

export interface OrcamentoItem {
  id: string;
  orcamento_id: string;
  procedimento_id: string | null;
  dente: string | null;
  face: string | null;
  descricao: string;
  valor_unitario: number;
  qtde: number;
  desconto_item: number;
  total: number;
  categoria: ProcedimentoCategoria | null;
  created_at: string;
}

export interface OrcamentoHistorico {
  id: string;
  orcamento_id: string;
  evento: string;
  detalhes: Record<string, unknown>;
  usuario_id: string | null;
  criado_em: string;
}

export interface Orcamento {
  id: string;
  codigo: string;
  paciente_id: string;
  profissional_id: string | null;
  status: OrcamentoStatus;
  validade: string | null;
  desconto_tipo: DescontoTipo | null;
  desconto_valor: number;
  valor_subtotal: number;
  valor_total: number;
  condicoes_pagamento: Record<string, unknown>;
  observacoes: string | null;
  travado: boolean;
  token_publico: string;
  criado_em: string;
  updated_at: string;
}

export interface OrcamentoComPaciente extends Orcamento {
  pacientes: { nome: string; cpf: string | null; telefone: string | null } | null;
}

export const CATEGORIA_LABELS: Record<ProcedimentoCategoria, string> = {
  dentistica:  'Dentística',
  endo:        'Endodontia',
  perio:       'Periodontia',
  cirurgia:    'Cirurgia',
  protese:     'Prótese / Implante',
  ortodontia:  'Ortodontia',
  estetica:    'Estética',
  prevencao:   'Prevenção',
};

export const STATUS_CONFIG: Record<OrcamentoStatus, { label: string; color: string; bg: string; border: string }> = {
  rascunho:   { label: 'Rascunho',    color: '#8A8A93', bg: 'rgba(138,138,147,0.1)', border: 'rgba(138,138,147,0.25)' },
  enviado:    { label: 'Enviado',     color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)' },
  negociacao: { label: 'Negociação',  color: '#FBBF24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)' },
  aprovado:   { label: 'Aprovado',    color: '#4ADE80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)' },
  recusado:   { label: 'Recusado',    color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
  expirado:   { label: 'Expirado',    color: '#8A8A93', bg: 'rgba(138,138,147,0.08)',border: 'rgba(138,138,147,0.15)' },
};
