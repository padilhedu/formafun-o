import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const limit = parseInt(searchParams.get('limit') ?? '20');

  let query = supabase
    .from('pacientes')
    .select('id, nome, cpf, telefone, status')
    .is('deleted_at', null)
    .eq('status', 'ativo')
    .order('nome')
    .limit(limit);

  if (q) {
    query = query.or(`nome.ilike.%${q}%,cpf.ilike.%${q}%,telefone.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const body = await req.json();

  const { data, error } = await supabase
    .from('pacientes')
    .insert(body)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'CPF já cadastrado.' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
