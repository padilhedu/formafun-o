import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Gera parcelas (contas a receber) a partir de orçamento aprovado
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json() as {
    parcelas?: number;
    primeiro_vencimento?: string; // YYYY-MM-DD
    forma_pagamento?: string;
    entrada?: number; // valor de entrada opcional
  };

  const numParcelas = Math.max(1, Math.min(36, body.parcelas ?? 1));
  if (!body.primeiro_vencimento) {
    return NextResponse.json({ error: 'primeiro_vencimento obrigatório' }, { status: 400 });
  }

  const { data: orc, error: orcErr } = await supabase
    .from('orcamentos')
    .select('id, codigo, paciente_id, valor_total, status')
    .eq('id', id)
    .single();

  if (orcErr || !orc) return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });

  const o = orc as { id: string; codigo: string; paciente_id: string; valor_total: number; status: string };

  if (o.status !== 'aprovado') {
    return NextResponse.json({ error: 'Apenas orçamentos aprovados geram parcelas' }, { status: 400 });
  }

  // Evita duplicar parcelas
  const { count } = await supabase
    .from('contas_receber')
    .select('id', { count: 'exact', head: true })
    .eq('orcamento_id', id)
    .neq('status', 'cancelado');

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'Orçamento já possui parcelas geradas' }, { status: 400 });
  }

  const entrada = body.entrada && body.entrada > 0 ? Math.min(body.entrada, o.valor_total) : 0;
  const restante = o.valor_total - entrada;
  const valorParcela = Math.floor((restante / numParcelas) * 100) / 100;
  const ajusteUltima = Math.round((restante - valorParcela * numParcelas) * 100) / 100;

  const primeiraData = new Date(body.primeiro_vencimento + 'T12:00:00');
  const rows: Record<string, unknown>[] = [];

  if (entrada > 0) {
    const { data: codigoEntrada } = await supabase.rpc('gerar_codigo_receber');
    rows.push({
      codigo: codigoEntrada,
      paciente_id: o.paciente_id,
      orcamento_id: o.id,
      descricao: `Entrada — ${o.codigo}`,
      parcela_num: 0,
      parcela_total: numParcelas,
      valor: entrada,
      vencimento: body.primeiro_vencimento,
      forma_pagamento: body.forma_pagamento ?? null,
      criado_por: user.id,
    });
  }

  for (let i = 0; i < numParcelas; i++) {
    const venc = new Date(primeiraData);
    // Entrada ocupa o primeiro vencimento; parcelas começam no mês seguinte
    venc.setMonth(venc.getMonth() + i + (entrada > 0 ? 1 : 0));
    const { data: codigo } = await supabase.rpc('gerar_codigo_receber');
    const valor = i === numParcelas - 1 ? valorParcela + ajusteUltima : valorParcela;
    rows.push({
      codigo,
      paciente_id: o.paciente_id,
      orcamento_id: o.id,
      descricao: `Parcela ${i + 1}/${numParcelas} — ${o.codigo}`,
      parcela_num: i + 1,
      parcela_total: numParcelas,
      valor,
      vencimento: venc.toISOString().slice(0, 10),
      forma_pagamento: body.forma_pagamento ?? null,
      criado_por: user.id,
    });
  }

  const { data, error } = await supabase.from('contas_receber').insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Histórico do orçamento
  await supabase.from('orcamento_historico').insert({
    orcamento_id: o.id,
    evento: 'parcelas_geradas',
    detalhes: { lancamentos: rows.length, parcelas: numParcelas, entrada },
    usuario_id: user.id,
  });

  return NextResponse.json(data, { status: 201 });
}
