import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderTemplate } from '@/lib/template-render';
import type { Orcamento, OrcamentoItem } from '@/types/orcamentos';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pacienteId = searchParams.get('paciente_id') ?? '';
  const orcamentoId = searchParams.get('orcamento_id') ?? '';

  let query = supabase
    .from('contratos')
    .select('*, pacientes(nome, cpf, email, telefone), orcamentos(codigo, valor_total)')
    .order('created_at', { ascending: false });

  if (pacienteId) query = query.eq('paciente_id', pacienteId);
  if (orcamentoId) query = query.eq('orcamento_id', orcamentoId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { template_id, orcamento_id, paciente_id } = body;

  // Load template
  const { data: template, error: tErr } = await supabase
    .from('contratos_templates')
    .select('*')
    .eq('id', template_id)
    .single();

  if (tErr || !template) return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });

  // Load patient
  const { data: paciente } = await supabase
    .from('pacientes')
    .select('nome, cpf, email, telefone, endereco')
    .eq('id', paciente_id)
    .single();

  // Load budget + items if provided
  let orcamento: Orcamento | null = null;
  let itens: OrcamentoItem[] = [];
  if (orcamento_id) {
    const { data: orcData } = await supabase.from('orcamentos').select('*').eq('id', orcamento_id).single();
    orcamento = orcData as Orcamento ?? null;
    const { data: itensData } = await supabase.from('orcamento_itens').select('*').eq('orcamento_id', orcamento_id);
    itens = (itensData as OrcamentoItem[]) ?? [];
  }

  // Render template
  const corpoHtmlFinal = renderTemplate((template as { corpo_html: string }).corpo_html, {
    paciente: paciente as { nome: string; cpf: string | null; email: string | null; telefone: string | null; endereco?: Record<string, string> | null },
    orcamento,
    itens,
  });

  // Generate code
  const { data: codeData } = await supabase.rpc('gerar_codigo_contrato');

  const { data, error } = await supabase
    .from('contratos')
    .insert({
      codigo: codeData as string,
      template_id,
      orcamento_id: orcamento_id ?? null,
      paciente_id,
      corpo_html_final: corpoHtmlFinal,
      criado_por: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
