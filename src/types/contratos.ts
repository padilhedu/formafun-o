export type ContratoStatus =
  | 'rascunho' | 'enviado' | 'visualizado' | 'assinado' | 'recusado' | 'cancelado';

export type TemplateTipo =
  | 'prestacao_servico' | 'ortodontia' | 'implante' | 'aditivo' | 'consentimento' | 'lgpd';

export interface ContratoTemplate {
  id: string;
  nome: string;
  tipo: TemplateTipo;
  corpo_html: string;
  ativo: boolean;
  created_at: string;
}

export interface Contrato {
  id: string;
  codigo: string;
  orcamento_id: string | null;
  paciente_id: string;
  template_id: string | null;
  status: ContratoStatus;
  corpo_html_final: string | null;
  zapsign_doc_token: string | null;
  zapsign_doc_url: string | null;
  pdf_url: string | null;
  storage_path: string | null;
  enviado_em: string | null;
  assinado_em: string | null;
  token_publico: string;
  criado_por: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContratoComRelacoes extends Contrato {
  pacientes: { nome: string; cpf: string | null; email: string | null; telefone: string | null } | null;
  orcamentos: { codigo: string; valor_total: number } | null;
}

export const CONTRATO_STATUS_CONFIG: Record<ContratoStatus, { label: string; color: string; bg: string; border: string; step: number }> = {
  rascunho:    { label: 'Rascunho',    color: '#8A8A93', bg: 'rgba(138,138,147,0.1)', border: 'rgba(138,138,147,0.25)', step: 0 },
  enviado:     { label: 'Enviado',     color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)',  step: 1 },
  visualizado: { label: 'Visualizado', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)',  step: 2 },
  assinado:    { label: 'Assinado',    color: '#4ADE80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)',  step: 3 },
  recusado:    { label: 'Recusado',    color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', step: -1 },
  cancelado:   { label: 'Cancelado',   color: '#8A8A93', bg: 'rgba(138,138,147,0.08)',border: 'rgba(138,138,147,0.15)', step: -1 },
};

export const TEMPLATE_TIPO_LABELS: Record<TemplateTipo, string> = {
  prestacao_servico: 'Prestação de Serviços',
  ortodontia:        'Ortodontia',
  implante:          'Implante',
  aditivo:           'Aditivo',
  consentimento:     'Consentimento (TCLE)',
  lgpd:              'Termo LGPD',
};

// Placeholders available in templates
export const PLACEHOLDERS = [
  { key: '{{paciente_nome}}',       desc: 'Nome completo do paciente' },
  { key: '{{paciente_cpf}}',        desc: 'CPF do paciente' },
  { key: '{{paciente_email}}',      desc: 'E-mail do paciente' },
  { key: '{{paciente_telefone}}',   desc: 'Telefone do paciente' },
  { key: '{{paciente_endereco}}',   desc: 'Endereço completo' },
  { key: '{{orcamento_codigo}}',    desc: 'Código do orçamento' },
  { key: '{{orcamento_total}}',     desc: 'Valor total formatado' },
  { key: '{{orcamento_validade}}',  desc: 'Data de validade do orçamento' },
  { key: '{{itens_tabela}}',        desc: 'Tabela HTML com todos os itens' },
  { key: '{{condicoes_pagamento}}', desc: 'Observações / condições de pagamento' },
  { key: '{{data_atual}}',          desc: 'Data atual (dia/mês/ano)' },
];
