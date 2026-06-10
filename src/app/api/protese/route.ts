import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function sb() {
  const c = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => c.getAll(), setAll: () => {} } }
  );
}

export async function GET() {
  const { data, error } = await sb()
    .from('protese_pedidos')
    .select('*, pacientes(nome)')
    .order('criado_em', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tipo, paciente_id, cor, medidas, laboratorio, prazo, valor, observacoes } = body;
  if (!tipo) return NextResponse.json({ error: 'tipo obrigatório' }, { status: 400 });
  const { data, error } = await sb()
    .from('protese_pedidos')
    .insert({ tipo, paciente_id, cor, medidas, laboratorio, prazo, valor, observacoes })
    .select('*, pacientes(nome)').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
