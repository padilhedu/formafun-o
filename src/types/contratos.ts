export type ContratoStatus =
  | 'rascunho' | 'enviado' | 'visualizado' | 'assinado' | 'recusado' | 'cancelado';

export type TemplateTipo =
  | 'prestacao_servico' | 'ortodontia' | 'implante' | 'aditivo' | 'consentimento' | 'lgpd';

export type CategoriaDocumento = 'contrato' | 'tcle';
export type OrigemTemplate = 'sistema' | 'juridico';
export type ArquivoTipo = 'docx' | 'pdf' | 'html';

export interface ContratoTemplate {
  id: string;
  nome: string;
  tipo: TemplateTipo;
  categoria_documento: CategoriaDocumento;
  origem: OrigemTemplate;
  versao: number;
  vigente: boolean;
  /** HTML legado — null em templates baseados em arquivo */
  corpo_html: string | null;
  arquivo_drive_id: string | null;
  ativo: boolean;
  created_at: string;
  // Campos de upload
  arquivo_original_url: string | null;
  arquivo_tipo: ArquivoTipo | null;
  placeholders_detectados: string[] | null;
  preview_pdf_url: string | null;
  /** true = PDF sem placeholders; assinatura é anexada ao PDF original */
  arquivo_estatico: boolean;
}

export interface ProcedimentoDocumento {
  id: string;
  categoria_procedimento: string;
  template_id: string;
  obrigatorio: boolean;
  criado_em: string;
}

export interface Contrato {
  id: string;
  codigo: string;
  orcamento_id: string | null;
  paciente_id: string;
  template_id: string | null;
  status: ContratoStatus;
  corpo_html_final: string | null;
  pdf_url: string | null;
  storage_path: string | null;
  token_publico: string;
  criado_por: string | null;
  created_at: string;
  updated_at: string;
  enviado_em: string | null;
  visualizado_em: string | null;
  assinado_em: string | null;
  recusado_em: string | null;
  recusa_motivo: string | null;
  travado: boolean;
  // Assinatura própria
  sign_token: string | null;
  sign_token_exp: string | null;
  sign_token_hmac: string | null;
  doc_hash: string | null;
  pdf_signed_url: string | null;
  signer_nome: string | null;
  signer_cpf: string | null;
  signer_ip: string | null;
  signer_user_agent: string | null;
  signer_lat: number | null;
  signer_lng: number | null;
  signature_svg: string | null;
}

export interface ContratoComRelacoes extends Contrato {
  pacientes: { nome: string; cpf: string | null; email: string | null; telefone: string | null } | null;
  orcamentos: { codigo: string; valor_total: number } | null;
}

export const CONTRATO_STATUS_CONFIG: Record<ContratoStatus, { label: string; color: string; bg: string; border: string; step: number }> = {
  rascunho:    { label: 'Rascunho',    color: '#6B6B66', bg: 'rgba(138,138,147,0.1)', border: 'rgba(138,138,147,0.25)', step: 0 },
  enviado:     { label: 'Enviado',     color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)',  step: 1 },
  visualizado: { label: 'Visualizado', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)',  step: 2 },
  assinado:    { label: 'Assinado',    color: '#4ADE80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)',  step: 3 },
  recusado:    { label: 'Recusado',    color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', step: -1 },
  cancelado:   { label: 'Cancelado',   color: '#6B6B66', bg: 'rgba(138,138,147,0.08)',border: 'rgba(138,138,147,0.15)', step: -1 },
};

export const TEMPLATE_TIPO_LABELS: Record<TemplateTipo, string> = {
  prestacao_servico: 'Prestação de Serviços',
  ortodontia:        'Ortodontia',
  implante:          'Implante',
  aditivo:           'Aditivo',
  consentimento:     'Consentimento (TCLE)',
  lgpd:              'Termo LGPD',
};

/**
 * Lista completa de placeholders disponíveis para templates .docx.
 * O jurídico deve inserir esses campos no Word exatamente como mostrado.
 * Para a lista de itens, usar o loop:  {{#itens}}...{{/itens}}
 */
export const PLACEHOLDERS = [
  // Paciente
  { key: '{{paciente_nome}}',        desc: 'Nome completo do paciente' },
  { key: '{{paciente_cpf}}',         desc: 'CPF do paciente' },
  { key: '{{paciente_email}}',       desc: 'E-mail do paciente' },
  { key: '{{paciente_telefone}}',    desc: 'Telefone do paciente' },
  { key: '{{paciente_endereco}}',    desc: 'Endereço completo do paciente' },
  // Dentista / Clínica
  { key: '{{dentista_nome}}',        desc: 'Nome do dentista responsável' },
  { key: '{{dentista_cro}}',         desc: 'CRO do dentista responsável' },
  { key: '{{clinica_nome}}',         desc: 'Nome da clínica' },
  { key: '{{clinica_cnpj}}',         desc: 'CNPJ da clínica' },
  { key: '{{clinica_endereco}}',     desc: 'Endereço da clínica' },
  { key: '{{cidade}}',               desc: 'Cidade da clínica' },
  // Orçamento
  { key: '{{orcamento_codigo}}',     desc: 'Código do orçamento (ex: ORC-2026-00001)' },
  { key: '{{data_orcamento}}',       desc: 'Data de emissão do orçamento' },
  { key: '{{validade_orcamento}}',   desc: 'Data de validade do orçamento' },
  { key: '{{valor_total}}',          desc: 'Valor total (ex: R$ 5.000,00)' },
  { key: '{{condicoes_pagamento}}',  desc: 'Condições / forma de pagamento' },
  { key: '{{clausulas_adicionais}}', desc: 'Cláusulas adicionais do orçamento' },
  // Datas
  { key: '{{data_geracao}}',         desc: 'Data de geração do documento' },
  // Loop de itens — para tabela de procedimentos no Word
  { key: '{{#itens}}',              desc: 'Início do bloco repetido por item' },
  { key: '{{descricao}}',           desc: '  ↳ Nome do procedimento' },
  { key: '{{dente}}',               desc: '  ↳ Número do dente' },
  { key: '{{qtd}}',                 desc: '  ↳ Quantidade' },
  { key: '{{valor}}',               desc: '  ↳ Valor unitário' },
  { key: '{{total}}',               desc: '  ↳ Valor total do item' },
  { key: '{{/itens}}',              desc: 'Fim do bloco repetido por item' },
];

/** Placeholders usados no HTML legado (renderTemplate.ts) — mantidos por retrocompatibilidade */
export const PLACEHOLDERS_HTML_LEGADO = [
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
