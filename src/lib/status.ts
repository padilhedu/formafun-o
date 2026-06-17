// Mapa centralizado de status — fonte única de verdade para badges, chips e timelines.

export type OrcamentoStatusKey = 'rascunho' | 'enviado' | 'negociacao' | 'visualizado' | 'aprovado' | 'recusado' | 'expirado';
export type AgendaStatusKey    = 'agendado' | 'confirmado' | 'confirmada' | 'em_atendimento' | 'aguardando' | 'concluido' | 'cancelado' | 'faltou';
export type ContratoStatusKey  = 'rascunho' | 'enviado' | 'aguardando' | 'assinado' | 'recusado';

interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  lineThrough?: boolean;
}

export const ORCAMENTO_STATUS: Record<OrcamentoStatusKey, StatusConfig> = {
  rascunho:    { label: 'Rascunho',       color: '#6B6B66', bg: 'rgba(107,107,102,0.10)', border: 'rgba(107,107,102,0.18)' },
  enviado:     { label: 'Enviado',         color: '#3A352B', bg: 'rgba(58,53,43,0.10)',   border: 'rgba(58,53,43,0.15)' },
  negociacao:  { label: 'Em Negociação',   color: '#2D6AA3', bg: 'rgba(45,106,163,0.10)', border: 'rgba(45,106,163,0.20)' },
  visualizado: { label: 'Visualizado',     color: '#C98A1E', bg: 'rgba(201,138,30,0.12)', border: 'rgba(201,138,30,0.20)' },
  aprovado:    { label: 'Aprovado',        color: '#1F7A4D', bg: 'rgba(31,122,77,0.10)',  border: 'rgba(31,122,77,0.20)' },
  recusado:    { label: 'Recusado',        color: '#C0392B', bg: 'rgba(192,57,43,0.10)',  border: 'rgba(192,57,43,0.20)' },
  expirado:    { label: 'Expirado',        color: '#6B6B66', bg: 'rgba(107,107,102,0.07)', border: 'rgba(107,107,102,0.12)', lineThrough: true },
};

export const AGENDA_STATUS: Record<AgendaStatusKey, StatusConfig> = {
  agendado:        { label: 'Agendado',        color: '#2D6AA3', bg: 'rgba(45,106,163,0.10)',  border: 'rgba(45,106,163,0.20)' },
  confirmado:      { label: 'Confirmado',      color: '#1F7A4D', bg: 'rgba(31,122,77,0.10)',   border: 'rgba(31,122,77,0.20)' },
  confirmada:      { label: 'Confirmado',      color: '#1F7A4D', bg: 'rgba(31,122,77,0.10)',   border: 'rgba(31,122,77,0.20)' },
  em_atendimento:  { label: 'Em atendimento',  color: '#1F7A4D', bg: 'rgba(31,122,77,0.15)',   border: 'rgba(31,122,77,0.28)' },
  aguardando:      { label: 'Aguardando',      color: '#C98A1E', bg: 'rgba(201,138,30,0.10)',  border: 'rgba(201,138,30,0.20)' },
  concluido:       { label: 'Concluído',       color: '#1F7A4D', bg: 'rgba(31,122,77,0.08)',   border: 'rgba(31,122,77,0.15)' },
  cancelado:       { label: 'Cancelado',       color: '#C0392B', bg: 'rgba(192,57,43,0.10)',   border: 'rgba(192,57,43,0.20)' },
  faltou:          { label: 'Faltou',          color: '#6B6B66', bg: 'rgba(107,107,102,0.10)', border: 'rgba(107,107,102,0.15)' },
};

export const CONTRATO_STATUS: Record<ContratoStatusKey, StatusConfig> = {
  rascunho:  { label: 'Rascunho',   color: '#6B6B66', bg: 'rgba(107,107,102,0.10)', border: 'rgba(107,107,102,0.18)' },
  enviado:   { label: 'Enviado',    color: '#2D6AA3', bg: 'rgba(45,106,163,0.10)',  border: 'rgba(45,106,163,0.20)' },
  aguardando:{ label: 'Aguardando', color: '#C98A1E', bg: 'rgba(201,138,30,0.10)',  border: 'rgba(201,138,30,0.20)' },
  assinado:  { label: 'Assinado',   color: '#1F7A4D', bg: 'rgba(31,122,77,0.10)',   border: 'rgba(31,122,77,0.20)' },
  recusado:  { label: 'Recusado',   color: '#C0392B', bg: 'rgba(192,57,43,0.10)',   border: 'rgba(192,57,43,0.20)' },
};

/** Resolve config para qualquer tipo de status; retorna fallback cinza se desconhecido. */
export function getStatusConfig(
  status: string,
  type: 'orcamento' | 'agenda' | 'contrato' = 'orcamento',
): StatusConfig {
  const map =
    type === 'agenda'   ? AGENDA_STATUS :
    type === 'contrato' ? CONTRATO_STATUS :
    ORCAMENTO_STATUS;
  return (map as Record<string, StatusConfig>)[status] ?? {
    label: status, color: '#6B6B66', bg: 'rgba(107,107,102,0.08)', border: 'rgba(107,107,102,0.12)',
  };
}
