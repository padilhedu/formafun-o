export type ProteseStatus = 'solicitado' | 'em_producao' | 'pronto' | 'entregue' | 'cancelado';

export interface ProtesePedido {
  id: string;
  paciente_id: string | null;
  dentista_id: string | null;
  tipo: string;
  cor: string | null;
  medidas: string | null;
  laboratorio: string | null;
  status: ProteseStatus;
  prazo: string | null;
  valor: number | null;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
  pacientes?: { nome: string } | null;
}

export const STATUS_LABEL: Record<ProteseStatus, string> = {
  solicitado: 'Solicitado',
  em_producao: 'Em Produção',
  pronto: 'Pronto',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export const STATUS_COR: Record<ProteseStatus, string> = {
  solicitado: '#60A5FA',
  em_producao: '#FBBF24',
  pronto: '#4ADE80',
  entregue: '#8A8A93',
  cancelado: '#F87171',
};

export const TIPOS_PROTESE = [
  'Coroa metalocerâmica','Coroa total cerâmica','Prótese parcial removível',
  'Prótese total','Implante','Faceta','Onlay/Inlay','Protocolo',
];
