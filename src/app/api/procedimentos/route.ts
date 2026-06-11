import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const categoria = searchParams.get('categoria') ?? '';
  const servicoFixo = searchParams.get('servico_fixo');

  let query = supabase
    .from('procedimentos_tabela')
    .select('*')
    .eq('ativo', true)
    .order('categoria')
    .order('nome');

  if (q) query = query.ilike('nome', `%${q}%`);
  if (categoria) query = query.eq('categoria', categoria);
  if (servicoFixo === 'true') query = query.eq('servico_fixo', true);
  else if (servicoFixo === 'false') query = query.eq('servico_fixo', false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from('procedimentos_tabela')
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
