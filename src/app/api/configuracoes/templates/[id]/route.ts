import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Edit creates new version; mark old as não-vigente
  const { data: old } = await sb.from('contratos_templates').select('*').eq('id', id).single();
  if (!old) return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });

  // Archive old version
  await sb.from('contratos_templates').update({ vigente: false }).eq('id', id);

  // Create new version — preserva campos de arquivo se não fornecidos
  const { data: novo, error } = await sb.from('contratos_templates').insert({
    nome: body.nome ?? old.nome,
    tipo: body.tipo ?? old.tipo,
    categoria_documento: body.categoria_documento ?? old.categoria_documento,
    origem: body.origem ?? old.origem,
    versao: (old.versao ?? 1) + 1,
    vigente: true,
    corpo_html: body.corpo_html ?? old.corpo_html,
    arquivo_original_url: body.arquivo_original_url ?? old.arquivo_original_url,
    arquivo_tipo: body.arquivo_tipo ?? old.arquivo_tipo,
    placeholders_detectados: body.placeholders_detectados ?? old.placeholders_detectados,
    preview_pdf_url: body.preview_pdf_url ?? old.preview_pdf_url,
    arquivo_estatico: body.arquivo_estatico ?? old.arquivo_estatico ?? false,
    ativo: true,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await sb.from('audit_log').insert({
    usuario_id: user.id, usuario_email: user.email,
    acao: 'update_template', tabela: 'contratos_templates', registro_id: novo.id,
    dados: { versao_anterior: id, nova_versao: novo.id },
  });

  return NextResponse.json(novo);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  await sb.from('contratos_templates').update({ ativo: false, vigente: false }).eq('id', id);
  return NextResponse.json({ ok: true });
}
