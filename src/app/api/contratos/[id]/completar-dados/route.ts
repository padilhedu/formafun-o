import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderTemplate } from '@/lib/template-render';
import crypto from 'crypto';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as { token: string; dados_paciente: Record<string, unknown> };

  if (!body.token || !body.dados_paciente) {
    return NextResponse.json({ error: 'token e dados_paciente são obrigatórios' }, { status: 400 });
  }

  // Rota pública — autenticação pelo sign_token (sem auth de sessão)
  const supabase = await createClient();

  const { data: c } = await supabase
    .from('contratos')
    .select('id, sign_token, sign_token_exp, status, html_template_parcial, campos_paciente, paciente_id, orcamento_id')
    .eq('id', id)
    .eq('sign_token', body.token)
    .single();

  if (!c) return NextResponse.json({ error: 'Contrato não encontrado ou token inválido' }, { status: 404 });
  if (!c.sign_token_exp || new Date(c.sign_token_exp) < new Date()) {
    return NextResponse.json({ error: 'Link expirado' }, { status: 410 });
  }
  if (c.status === 'assinado') {
    return NextResponse.json({ error: 'Contrato já assinado' }, { status: 400 });
  }
  if (!c.html_template_parcial) {
    return NextResponse.json({ error: 'Este contrato não requer preenchimento de dados pelo paciente' }, { status: 400 });
  }

  // Validar campos obrigatórios
  type CampoPaciente = { key: string; label: string; type: string };
  const camposDef = (c.campos_paciente ?? []) as CampoPaciente[];
  const faltando = camposDef.filter(cp => {
    const v = body.dados_paciente[cp.key];
    return v === undefined || v === null || String(v).trim() === '';
  });
  if (faltando.length > 0) {
    return NextResponse.json({ error: `Preencha: ${faltando.map(f => f.label).join(', ')}`, campos_faltando: faltando.map(f => f.key) }, { status: 422 });
  }

  // Buscar dados do paciente e clínica para renderização final
  const [{ data: paciente }, { data: clinicaCfg }] = await Promise.all([
    supabase.from('pacientes').select('nome, cpf, email, telefone, endereco').eq('id', c.paciente_id).single(),
    supabase.from('configuracoes').select('valor').eq('chave', 'clinica').single(),
  ]);

  const clinicaNome = (clinicaCfg?.valor as { nome?: string } | null)?.nome ?? 'Clínica Odontológica';

  // Combinar dados da recepção (já embutidos no html_template_parcial) com dados do paciente
  const htmlFinal = renderTemplate(c.html_template_parcial as string, {
    paciente: {
      nome: paciente?.nome ?? '',
      cpf: paciente?.cpf ?? null,
      email: paciente?.email ?? null,
      telefone: paciente?.telefone ?? null,
      endereco: paciente?.endereco as Record<string, string> | null ?? null,
    },
    extras: body.dados_paciente,
    clinica_nome: clinicaNome,
  });

  const docHash = crypto.createHash('sha256').update(htmlFinal).digest('hex');

  // Atualizar contrato com HTML final e dados do paciente
  const { error: updateErr } = await supabase.from('contratos').update({
    corpo_html_final: htmlFinal,
    doc_hash: docHash,
    dados_paciente_extras: body.dados_paciente,
  }).eq('id', id);

  if (updateErr) return NextResponse.json({ error: 'Erro ao salvar dados' }, { status: 500 });

  // Salvar HTML final no Storage (não bloqueante)
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient: adminClient } = await import('@supabase/supabase-js');
      const admin = adminClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
      await admin.storage.from('contratos-html').upload(`${id}/original.html`, Buffer.from(htmlFinal, 'utf-8'), {
        contentType: 'text/html; charset=utf-8',
        upsert: true,
      });
    } catch {}
  }

  return NextResponse.json({ corpo_html_final: htmlFinal });
}
