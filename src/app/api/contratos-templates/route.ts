import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { data, error } = await supabase
    .from('contratos_templates')
    .select('*')
    .eq('ativo', true)
    .order('nome');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json() as { nome?: string; tipo?: string; corpo_html?: string };
  if (!body.nome || !body.tipo || !body.corpo_html) {
    return NextResponse.json({ error: 'Campos obrigatórios: nome, tipo, corpo_html' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('contratos_templates')
    .insert({ nome: body.nome, tipo: body.tipo, corpo_html: body.corpo_html, ativo: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
