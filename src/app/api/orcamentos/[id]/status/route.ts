import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { OrcamentoStatus } from '@/types/orcamentos';

const TRANSICOES_VALIDAS: Record<OrcamentoStatus, OrcamentoStatus[]> = {
  rascunho:   ['enviado', 'recusado'],
  enviado:    ['negociacao', 'aprovado', 'recusado', 'expirado'],
  negociacao: ['aprovado', 'recusado', 'expirado'],
  aprovado:   [],
  recusado:   ['rascunho'],
  expirado:   ['rascunho'],
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { status: OrcamentoStatus };
  const novoStatus = body.status;

  const { data: orc } = await supabase
    .from('orcamentos')
    .select('id, status, travado')
    .eq('id', id)
    .single();

  if (!orc) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  if (orc.travado) return NextResponse.json({ error: 'Orçamento travado' }, { status: 400 });

  const transicoes = TRANSICOES_VALIDAS[(orc as { status: OrcamentoStatus }).status];
  if (!transicoes.includes(novoStatus)) {
    return NextResponse.json({ error: `Transição inválida: ${(orc as { status: string }).status} → ${novoStatus}` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('orcamentos')
    .update({ status: novoStatus })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('orcamento_historico').insert({
    orcamento_id: id,
    evento: novoStatus,
    detalhes: { status_anterior: (orc as { status: string }).status },
    usuario_id: user.id,
  });

  return NextResponse.json(data);
}
