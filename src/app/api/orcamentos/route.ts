import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? '';
  const pacienteId = searchParams.get('paciente_id') ?? '';

  let query = supabase
    .from('orcamentos')
    .select('*, pacientes(nome, cpf, telefone)')
    .order('criado_em', { ascending: false });

  if (status) query = query.eq('status', status);
  if (pacienteId) query = query.eq('paciente_id', pacienteId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // Generate sequential code via DB function
  const { data: codeData, error: rpcError } = await supabase.rpc('gerar_codigo_orcamento');
  if (rpcError) {
    console.error('[gerar_codigo_orcamento] RPC error:', rpcError.message);
    return NextResponse.json({ error: `Falha ao gerar código do orçamento: ${rpcError.message}` }, { status: 500 });
  }
  const codigo = codeData as string;

  const validade = new Date();
  validade.setDate(validade.getDate() + 30);

  const { data, error } = await supabase
    .from('orcamentos')
    .insert({
      ...body,
      codigo,
      profissional_id: user.id,
      validade: validade.toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log creation
  await supabase.from('orcamento_historico').insert({
    orcamento_id: (data as { id: string }).id,
    evento: 'criado',
    detalhes: { codigo },
    usuario_id: user.id,
  });

  return NextResponse.json(data, { status: 201 });
}
