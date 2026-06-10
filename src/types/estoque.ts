export interface EstoqueItem {
  id: string;
  nome: string;
  categoria: string | null;
  unidade: string;
  quantidade: number;
  quantidade_minima: number;
  valor_unitario: number | null;
  fornecedor: string | null;
  codigo: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export type MovimentoTipo = 'entrada' | 'saida' | 'ajuste';

export interface EstoqueMovimento {
  id: string;
  item_id: string;
  tipo: MovimentoTipo;
  quantidade: number;
  motivo: string | null;
  usuario_id: string | null;
  criado_em: string;
}

export const CATEGORIAS = ['Anestésico','Resina','Cimento','EPI','Material cirúrgico','Limpeza','Outros'];
