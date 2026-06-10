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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const campos: Record<string, unknown> = {};
  for (const k of ['nome','categoria','unidade','quantidade_minima','valor_unitario','fornecedor','codigo','ativo']) {
    if (k in body) campos[k] = body[k];
  }
  const { data, error } = await sb().from('estoque_itens').update(campos).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await sb().from('estoque_itens').update({ ativo: false }).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
