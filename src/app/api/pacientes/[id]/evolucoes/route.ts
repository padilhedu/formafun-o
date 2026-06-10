import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const { procedimento, dente, descricao } = await req.json();

  if (!procedimento?.trim()) {
    return NextResponse.json({ error: 'Procedimento é obrigatório.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('evolucoes')
    .insert({
      paciente_id: id,
      profissional_id: user.id,
      procedimento: procedimento.trim(),
      dente: dente || null,
      descricao: descricao || null,
      data: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from('audit_log').insert({
    usuario_id: user.id,
    acao: 'criacao_evolucao',
    tabela: 'evolucoes',
    registro_id: id,
    detalhes: { procedimento, dente },
  });

  return NextResponse.json(data, { status: 201 });
}
