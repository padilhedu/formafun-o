export type OrcamentoStatusKey = 'rascunho' | 'enviado' | 'negociacao' | 'aprovado' | 'recusado' | 'expirado';
export type AgendaStatusKey   = 'agendado' | 'confirmado' | 'em_atendimento' | 'realizado' | 'cancelado' | 'faltou';
export type ContratoStatusKey = 'rascunho' | 'aguardando_assinatura' | 'assinado' | 'cancelado';

interface StatusStyle { label: string; color: string; bg: string; border: string; }

export const ORCAMENTO_STATUS: Record<OrcamentoStatusKey, StatusStyle> = {
  rascunho:   { label: 'Rascunho',   color: '#6B6B66', bg: 'rgba(107,107,102,0.10)', border: 'rgba(107,107,102,0.20)' },
  enviado:    { label: 'Enviado',    color: '#3A3A3A', bg: 'rgba(28,28,28,0.07)',    border: 'rgba(28,28,28,0.15)'   },
  negociacao: { label: 'Negociação', color: '#C98A1E', bg: 'rgba(201,138,30,0.12)',  border: 'rgba(201,138,30,0.25)' },
  aprovado:   { label: 'Aprovado',   color: '#1F7A4D', bg: 'rgba(31,122,77,0.10)',   border: 'rgba(31,122,77,0.25)'  },
  recusado:   { label: 'Recusado',   color: '#C0392B', bg: 'rgba(192,57,43,0.10)',   border: 'rgba(192,57,43,0.20)'  },
  expirado:   { label: 'Expirado',   color: '#9B9BA0', bg: 'rgba(107,107,102,0.06)', border: 'rgba(107,107,102,0.15)'},
};

export const AGENDA_STATUS: Record<AgendaStatusKey, StatusStyle> = {
  agendado:        { label: 'Agendado',        color: '#C98A1E', bg: 'rgba(201,138,30,0.10)', border: 'rgba(201,138,30,0.20)' },
  confirmado:      { label: 'Confirmado',      color: '#1F7A4D', bg: 'rgba(31,122,77,0.10)',  border: 'rgba(31,122,77,0.20)'  },
  em_atendimento:  { label: 'Em atendimento',  color: '#1F7A4D', bg: 'rgba(31,122,77,0.15)',  border: 'rgba(31,122,77,0.30)'  },
  realizado:       { label: 'Realizado',       color: '#6B6B66', bg: 'rgba(107,107,102,0.10)',border: 'rgba(107,107,102,0.20)'},
  cancelado:       { label: 'Cancelado',       color: '#C0392B', bg: 'rgba(192,57,43,0.10)',  border: 'rgba(192,57,43,0.20)'  },
  faltou:          { label: 'Faltou',          color: '#C0392B', bg: 'rgba(192,57,43,0.10)',  border: 'rgba(192,57,43,0.20)'  },
};

export const CONTRATO_STATUS: Record<ContratoStatusKey, StatusStyle> = {
  rascunho:              { label: 'Rascunho',              color: '#6B6B66', bg: 'rgba(107,107,102,0.10)', border: 'rgba(107,107,102,0.20)' },
  aguardando_assinatura: { label: 'Aguardando assinatura', color: '#C98A1E', bg: 'rgba(201,138,30,0.12)',  border: 'rgba(201,138,30,0.25)' },
  assinado:              { label: 'Assinado',              color: '#1F7A4D', bg: 'rgba(31,122,77,0.10)',   border: 'rgba(31,122,77,0.25)'  },
  cancelado:             { label: 'Cancelado',             color: '#C0392B', bg: 'rgba(192,57,43,0.10)',   border: 'rgba(192,57,43,0.20)'  },
};

export function getOrcamentoStatus(s: string): StatusStyle {
  return ORCAMENTO_STATUS[s as OrcamentoStatusKey] ?? ORCAMENTO_STATUS.rascunho;
}
export function getAgendaStatus(s: string): StatusStyle {
  return AGENDA_STATUS[s as AgendaStatusKey] ?? AGENDA_STATUS.agendado;
}
export function getContratoStatus(s: string): StatusStyle {
  return CONTRATO_STATUS[s as ContratoStatusKey] ?? CONTRATO_STATUS.rascunho;
}
