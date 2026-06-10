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

// GET histórico de movimentos do item
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await sb()
    .from('estoque_movimentos')
    .select('*')
    .eq('item_id', params.id)
    .order('criado_em', { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST registrar movimento (trigger atualiza quantidade)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { tipo, quantidade, motivo } = await req.json();
  if (!tipo || !quantidade) return NextResponse.json({ error: 'tipo e quantidade obrigatórios' }, { status: 400 });
  const { data, error } = await sb()
    .from('estoque_movimentos')
    .insert({ item_id: params.id, tipo, quantidade: Number(quantidade), motivo })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Retorna item atualizado junto
  const { data: item } = await sb().from('estoque_itens').select('*').eq('id', params.id).single();
  return NextResponse.json({ movimento: data, item }, { status: 201 });
}
