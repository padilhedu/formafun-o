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
  const { data, error } = await client.from('leads').select('*').order('criado_em', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const client = await sb();
  const body = await req.json();
  const { nome, telefone, email, origem, status, observacoes } = body;
  if (!nome) return NextResponse.json({ error: 'nome obrigatório' }, { status: 400 });
  const { data, error } = await client
    .from('leads')
    .insert({ nome, telefone, email, origem: origem || 'outros', status: status || 'novo', observacoes })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
