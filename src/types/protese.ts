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
  em_producao: '#C98A1E',
  pronto: '#1F7A4D',
  entregue: '#6B6B66',
  cancelado: '#C0392B',
};

export const TIPOS_PROTESE = [
  'Coroa metalocerâmica','Coroa total cerâmica','Prótese parcial removível',
  'Prótese total','Implante','Faceta','Onlay/Inlay','Protocolo',
];
