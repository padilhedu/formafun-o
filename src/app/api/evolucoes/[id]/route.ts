import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const LOCK_HOURS = 24;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  // Buscar a evolução para verificar janela de 24h
  const { data: evolucao, error: fetchErr } = await supabase
    .from('evolucoes')
    .select('id, data, paciente_id')
    .eq('id', id)
    .single();

  if (fetchErr || !evolucao) return NextResponse.json({ error: 'Evolução não encontrada' }, { status: 404 });

  // Verificar janela de 24h (regra CFO)
  const criadoEm = new Date(evolucao.data);
  const limiteTrava = new Date(criadoEm.getTime() + LOCK_HOURS * 60 * 60 * 1000);
  if (new Date() > limiteTrava) {
    return NextResponse.json(
      { error: `Evolução travada — só é possível editar até ${LOCK_HOURS}h após o registro (CFO).` },
      { status: 403 }
    );
  }

  const body = await req.json() as { procedimento?: string; dente?: string | null; descricao?: string | null };
  if (!body.procedimento?.trim()) {
    return NextResponse.json({ error: 'Procedimento é obrigatório.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('evolucoes')
    .update({
      procedimento: body.procedimento.trim(),
      dente: body.dente ?? null,
      descricao: body.descricao ?? null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Audit — edição de evolução é dado clínico sensível
  await supabase.from('audit_log').insert({
    usuario_id: user.id,
    acao: 'edicao_evolucao',
    tabela: 'evolucoes',
    registro_id: evolucao.paciente_id,
    detalhes: { evolucao_id: id, procedimento: body.procedimento },
  });

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { data: evolucao } = await supabase
    .from('evolucoes')
    .select('id, data, paciente_id')
    .eq('id', id)
    .single();

  if (!evolucao) return NextResponse.json({ error: 'Evolução não encontrada' }, { status: 404 });

  const criadoEm = new Date(evolucao.data);
  const limiteTrava = new Date(criadoEm.getTime() + LOCK_HOURS * 60 * 60 * 1000);
  if (new Date() > limiteTrava) {
    return NextResponse.json(
      { error: `Evolução travada — exclusão só é possível até ${LOCK_HOURS}h após o registro (CFO).` },
      { status: 403 }
    );
  }

  const { error } = await supabase.from('evolucoes').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from('audit_log').insert({
    usuario_id: user.id,
    acao: 'exclusao_evolucao',
    tabela: 'evolucoes',
    registro_id: evolucao.paciente_id,
    detalhes: { evolucao_id: id },
  });

  return NextResponse.json({ ok: true });
}
