import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json() as { nome?: string; tipo?: string; corpo_html?: string; ativo?: boolean };

  const updates: Record<string, unknown> = {};
  if (body.nome !== undefined) updates.nome = body.nome;
  if (body.tipo !== undefined) updates.tipo = body.tipo;
  if (body.corpo_html !== undefined) updates.corpo_html = body.corpo_html;
  if (body.ativo !== undefined) updates.ativo = body.ativo;

  const { data, error } = await supabase
    .from('contratos_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { error } = await supabase
    .from('contratos_templates')
    .update({ ativo: false })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
