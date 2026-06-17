export type EventoTipo = 'consulta' | 'retorno' | 'avaliacao' | 'emergencia' | 'bloqueio';
export type EventoStatus = 'agendado' | 'confirmado' | 'realizado' | 'cancelado' | 'faltou';

export interface AgendaEvento {
  id: string;
  paciente_id: string | null;
  dentista_id: string | null;
  titulo: string;
  descricao: string | null;
  tipo: EventoTipo;
  status: EventoStatus;
  inicio: string;
  fim: string;
  cor: string;
  whatsapp_enviado: boolean;
  whatsapp_confirmado: boolean;
  criado_em: string;
  atualizado_em: string;
  pacientes?: { nome: string; telefone: string | null } | null;
}

export const TIPO_LABEL: Record<EventoTipo, string> = {
  consulta: 'Consulta',
  retorno: 'Retorno',
  avaliacao: 'Avaliação',
  emergencia: 'Emergência',
  bloqueio: 'Bloqueio',
};

export const STATUS_LABEL: Record<EventoStatus, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
  faltou: 'Faltou',
};

export const STATUS_COR: Record<EventoStatus, string> = {
  agendado: '#7B5DC0',
  confirmado: '#1F7A4D',
  realizado: '#6B6B66',
  cancelado: '#C0392B',
  faltou: '#C98A1E',
};

export const TIPO_COR: Record<EventoTipo, string> = {
  consulta: '#59399E',
  retorno: '#3B82F6',
  avaliacao: '#10B981',
  emergencia: '#EF4444',
  bloqueio: '#6B7280',
};
