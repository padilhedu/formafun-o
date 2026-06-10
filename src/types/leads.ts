export type LeadStatus = 'novo' | 'contato' | 'agendado' | 'convertido' | 'perdido';
export type LeadOrigem = 'indicacao' | 'instagram' | 'google' | 'site' | 'outros';

export interface Lead {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  origem: LeadOrigem;
  status: LeadStatus;
  observacoes: string | null;
  dentista_id: string | null;
  convertido_paciente_id: string | null;
  criado_em: string;
  atualizado_em: string;
}

export const STATUS_LABEL: Record<LeadStatus, string> = {
  novo: 'Novo',
  contato: 'Em Contato',
  agendado: 'Agendado',
  convertido: 'Convertido',
  perdido: 'Perdido',
};

export const STATUS_COR: Record<LeadStatus, string> = {
  novo: '#60A5FA',
  contato: '#FBBF24',
  agendado: '#A07FD4',
  convertido: '#4ADE80',
  perdido: '#F87171',
};

export const ORIGEM_LABEL: Record<LeadOrigem, string> = {
  indicacao: 'Indicação',
  instagram: 'Instagram',
  google: 'Google',
  site: 'Site',
  outros: 'Outros',
};
