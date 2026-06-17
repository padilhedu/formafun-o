export type OrcamentoStatus = 'rascunho' | 'enviado' | 'negociacao' | 'aprovado' | 'recusado' | 'expirado';
export type DescontoTipo = 'percentual' | 'valor';
export type ProcedimentoCategoria =
  | 'dentistica' | 'endo' | 'perio' | 'cirurgia'
  | 'protese' | 'ortodontia' | 'estetica' | 'prevencao' | 'servico';

export interface ProcedimentoTabela {
  id: string;
  codigo: string | null;
  nome: string;
  categoria: ProcedimentoCategoria;
  valor_base: number;
  custo_estimado: number | null;
  duracao_min: number;
  ativo: boolean;
  servico_fixo: boolean;
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
  selecionado: boolean;
  fixado: boolean;
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

export interface ModeloPagamento {
  id: string;
  nome: string;
  entrada_percentual: number;
  parcelas: number;
  juros_percentual: number;
  desconto_avista_percentual: number;
  ativo: boolean;
}

export interface Orcamento {
  id: string;
  codigo: string;
  paciente_id: string;
  profissional_id: string | null;
  status: OrcamentoStatus;
  validade: string | null;
  data_avaliacao: string | null;
  desconto_tipo: DescontoTipo | null;
  desconto_valor: number;
  desconto_motivo: string | null;
  valor_subtotal: number;
  valor_total: number;
  convenio: string | null;
  sessoes_previstas: number | null;
  observacoes: string | null;
  observacao_interna: string | null;
  clausulas_adicionais: string | null;
  modelo_pagamento_id: string | null;
  condicoes_pagamento: Record<string, unknown>;
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
  servico:     'Serviços',
};

export const STATUS_CONFIG: Record<OrcamentoStatus, { label: string; color: string; bg: string; border: string }> = {
  rascunho:   { label: 'Rascunho',    color: '#6B6B66', bg: 'rgba(107,107,102,0.10)', border: 'rgba(107,107,102,0.20)' },
  enviado:    { label: 'Enviado',     color: '#3A3A3A', bg: 'rgba(28,28,28,0.07)',    border: 'rgba(28,28,28,0.15)'   },
  negociacao: { label: 'Negociação',  color: '#C98A1E', bg: 'rgba(201,138,30,0.12)',  border: 'rgba(201,138,30,0.25)' },
  aprovado:   { label: 'Aprovado',    color: '#1F7A4D', bg: 'rgba(31,122,77,0.10)',   border: 'rgba(31,122,77,0.25)'  },
  recusado:   { label: 'Recusado',    color: '#C0392B', bg: 'rgba(192,57,43,0.10)',   border: 'rgba(192,57,43,0.20)'  },
  expirado:   { label: 'Expirado',    color: '#9B9BA0', bg: 'rgba(107,107,102,0.06)', border: 'rgba(107,107,102,0.15)'},
};
