import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: orc } = await supabase
    .from('orcamentos')
    .select('id, codigo, status, travado')
    .eq('id', id)
    .single();

  if (!orc) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  if (orc.travado) return NextResponse.json({ error: 'Já travado' }, { status: 400 });

  const { data, error } = await supabase
    .from('orcamentos')
    .update({ status: 'aprovado' })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('orcamento_historico').insert({
    orcamento_id: id,
    evento: 'aprovado',
    detalhes: { status_anterior: orc.status },
    usuario_id: user.id,
  });

  return NextResponse.json(data);
}
