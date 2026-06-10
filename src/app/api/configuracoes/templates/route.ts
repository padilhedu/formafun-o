import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { data, error } = await sb
    .from('contratos_templates')
    .select('*')
    .eq('vigente', true)
    .order('nome');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  if (!body.nome) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });

  const { data, error } = await sb.from('contratos_templates').insert({
    ...body,
    versao: 1,
    vigente: true,
    origem: body.origem ?? 'sistema',
    categoria_documento: body.categoria_documento ?? 'contrato',
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await sb.from('audit_log').insert({
    usuario_id: user.id, usuario_email: user.email,
    acao: 'create_template', tabela: 'contratos_templates', registro_id: data.id,
  });

  return NextResponse.json(data, { status: 201 });
}
