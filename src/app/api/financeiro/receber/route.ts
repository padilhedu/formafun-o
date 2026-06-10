import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const status = req.nextUrl.searchParams.get('status');
  const pacienteId = req.nextUrl.searchParams.get('paciente_id');

  let query = supabase
    .from('contas_receber')
    .select('*, pacientes(nome, cpf, email, telefone), orcamentos(codigo)')
    .order('vencimento');

  if (status) query = query.eq('status', status);
  if (pacienteId) query = query.eq('paciente_id', pacienteId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json() as {
    paciente_id?: string;
    descricao?: string;
    valor?: number;
    vencimento?: string;
    forma_pagamento?: string;
    observacoes?: string;
  };

  if (!body.descricao || !body.valor || !body.vencimento) {
    return NextResponse.json({ error: 'Campos obrigatórios: descricao, valor, vencimento' }, { status: 400 });
  }

  const { data: codigo } = await supabase.rpc('gerar_codigo_receber');

  const { data, error } = await supabase
    .from('contas_receber')
    .insert({
      codigo,
      paciente_id: body.paciente_id ?? null,
      descricao: body.descricao,
      valor: body.valor,
      vencimento: body.vencimento,
      forma_pagamento: body.forma_pagamento ?? null,
      observacoes: body.observacoes ?? null,
      criado_por: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
