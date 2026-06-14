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

  // Gerar parcelas automaticamente (padrão: 1 parcela no total, 30 dias)
  const orc_full = data as { id: string; codigo: string; paciente_id: string; valor_total: number };
  const venc30 = new Date();
  venc30.setDate(venc30.getDate() + 30);
  const vencStr = venc30.toISOString().split('T')[0];

  // Checar se já tem parcelas (edge case)
  const { count: existingCount } = await supabase
    .from('contas_receber')
    .select('id', { count: 'exact', head: true })
    .eq('orcamento_id', id)
    .neq('status', 'cancelado');

  if (!existingCount) {
    const { data: codigoReceber } = await supabase.rpc('gerar_codigo_receber');
    await supabase.from('contas_receber').insert({
      codigo: codigoReceber,
      paciente_id: orc_full.paciente_id,
      orcamento_id: orc_full.id,
      descricao: `Pagamento — ${orc_full.codigo}`,
      parcela_num: 1,
      parcela_total: 1,
      valor: orc_full.valor_total,
      vencimento: vencStr,
      criado_por: user.id,
    });
  }

  await supabase.from('orcamento_historico').insert({
    orcamento_id: id,
    evento: 'aprovado',
    detalhes: { status_anterior: orc.status, parcelas_auto_geradas: !existingCount },
    usuario_id: user.id,
  });

  return NextResponse.json(data);
}
