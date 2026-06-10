import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const { respostas, alertas } = await req.json();

  // Upsert — só uma anamnese ativa por paciente
  const { data: existing } = await supabase
    .from('anamneses')
    .select('id')
    .eq('paciente_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from('anamneses')
      .update({ respostas, alertas })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    result = data;
  } else {
    const { data, error } = await supabase
      .from('anamneses')
      .insert({ paciente_id: id, respostas, alertas, criada_por: user.id })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    result = data;
  }

  // Atualizar alertas no prontuário para leitura rápida
  await supabase.from('audit_log').insert({
    usuario_id: user.id,
    acao: 'edicao_anamnese',
    tabela: 'anamneses',
    registro_id: id,
    detalhes: { alertas },
  });

  return NextResponse.json(result);
}
