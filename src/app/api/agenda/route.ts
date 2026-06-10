import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function sb() {
  const c = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => c.getAll(), setAll: () => {} } }
  );
}

export async function GET(req: NextRequest) {
  const client = await sb();
  const { searchParams } = new URL(req.url);
  const inicio = searchParams.get('inicio');
  const fim = searchParams.get('fim');

  let query = client
    .from('agenda_eventos')
    .select('*, pacientes(nome, telefone)')
    .order('inicio');

  if (inicio) query = query.gte('inicio', inicio);
  if (fim) query = query.lte('inicio', fim);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const client = await sb();
  const body = await req.json();
  const { titulo, descricao, tipo, inicio, fim, paciente_id, dentista_id, cor } = body;

  if (!titulo || !inicio || !fim) {
    return NextResponse.json({ error: 'titulo, inicio e fim são obrigatórios' }, { status: 400 });
  }

  const { data, error } = await client
    .from('agenda_eventos')
    .insert({
      titulo, descricao: descricao || null, tipo: tipo || 'consulta',
      inicio, fim, paciente_id: paciente_id || null,
      dentista_id: dentista_id || null, cor: cor || '#59399E',
    })
    .select('*, pacientes(nome, telefone)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
