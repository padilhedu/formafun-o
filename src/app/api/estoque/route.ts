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

export async function GET() {
  const client = await sb();
  const { data, error } = await client.from('estoque_itens').select('*').eq('ativo', true).order('nome');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const client = await sb();
  const body = await req.json();
  const { nome, categoria, unidade, quantidade_minima, valor_unitario, fornecedor, codigo } = body;
  if (!nome) return NextResponse.json({ error: 'nome obrigatório' }, { status: 400 });
  const { data, error } = await client
    .from('estoque_itens')
    .insert({ nome, categoria, unidade: unidade || 'un', quantidade_minima: quantidade_minima || 0, valor_unitario, fornecedor, codigo })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
