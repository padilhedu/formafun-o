import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('orcamentos')
    .select('*, pacientes(nome, cpf, telefone, email, data_nascimento), orcamento_itens(*), orcamento_historico(*)')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Prevent edits on locked budgets
  const { data: existing } = await supabase
    .from('orcamentos')
    .select('travado, status')
    .eq('id', id)
    .single();

  if (existing?.travado) {
    return NextResponse.json({ error: 'Orçamento travado — não pode ser editado' }, { status: 403 });
  }

  const body = await req.json();
  const { itens, ...orcamentoData } = body;

  // Update budget
  const { data, error } = await supabase
    .from('orcamentos')
    .update(orcamentoData)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Replace items if provided
  if (itens !== undefined) {
    await supabase.from('orcamento_itens').delete().eq('orcamento_id', id);
    if (itens.length > 0) {
      await supabase.from('orcamento_itens').insert(
        itens.map((item: Record<string, unknown>) => ({ ...item, orcamento_id: id }))
      );
    }
  }

  return NextResponse.json(data);
}
