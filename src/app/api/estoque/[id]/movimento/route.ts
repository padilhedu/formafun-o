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

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await sb();
  const { data, error } = await client
    .from('estoque_movimentos').select('*').eq('item_id', id)
    .order('criado_em', { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await sb();
  const { tipo, quantidade, motivo } = await req.json();
  if (!tipo || !quantidade) return NextResponse.json({ error: 'tipo e quantidade obrigatórios' }, { status: 400 });
  const { data, error } = await client
    .from('estoque_movimentos')
    .insert({ item_id: id, tipo, quantidade: Number(quantidade), motivo })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: item } = await client.from('estoque_itens').select('*').eq('id', id).single();
  return NextResponse.json({ movimento: data, item }, { status: 201 });
}
