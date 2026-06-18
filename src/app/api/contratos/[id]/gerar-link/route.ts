import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderTemplate, renderTemplateParcial } from '@/lib/template-render';
import { getSigningSecret } from '@/lib/signing-secret';
import crypto from 'crypto';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Falhar explicitamente se o segredo HMAC não estiver configurado
  if (!process.env.SIGNING_HMAC_SECRET) {
    console.error('[gerar-link] SIGNING_HMAC_SECRET não definida. Configure a variável de ambiente.');
    return NextResponse.json({ error: 'Configuração de assinatura ausente no servidor (SIGNING_HMAC_SECRET).' }, { status: 500 });
  }

  // CA-01: garantir URL de produção válida antes de gerar o link
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.error('[gerar-link] NEXT_PUBLIC_APP_URL não definida.');
    return NextResponse.json({ error: 'URL da aplicação não configurada no servidor.' }, { status: 500 });
  }

  const { id } = await params;

  let body: { dados_recepcao?: Record<string, unknown> } = {};
  try { body = await req.json() as typeof body; } catch { /* empty body */ }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  let { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  // Auto-criar profile se o trigger não tiver criado (ex: usuário existente antes da migration)
  if (!profile) {
    const { createClient: createServiceClient } = await import('@supabase/supabase-js');
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const nome = user.user_metadata?.nome ?? user.email?.split('@')[0] ?? 'Usuário';
    await admin.from('profiles').upsert({ id: user.id, nome, role: 'admin' });
    profile = { role: 'admin' };
  }

  if (!['admin', 'recepcao'].includes(profile.role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const { data: c, error } = await supabase
    .from('contratos')
    .select(`
      id, codigo, status, template_id,
      pacientes(nome, cpf, email, telefone, endereco),
      orcamentos(id, codigo, valor_total, validade, observacoes, clausulas_adicionais,
        orcamento_itens(descricao, dente, face, qtde, valor_unitario, total, selecionado, categoria)),
      contratos_templates(corpo_html, nome, campos_paciente, campos_recepcao)
    `)
    .eq('id', id)
    .single();

  if (error || !c) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });
  if (c.status !== 'rascunho') return NextResponse.json({ error: 'Só é possível gerar link para contratos em rascunho' }, { status: 400 });

  type Pac = { nome: string; cpf: string | null; email: string | null; telefone: string | null; endereco: Record<string, string> | null };
  type Orc = { id: string; codigo: string; valor_total: number; validade: string | null; observacoes: string | null; clausulas_adicionais: string | null; orcamento_itens: { descricao: string; dente: string | null; face: string | null; qtde: number; valor_unitario: number; total: number; selecionado: boolean; categoria: string | null }[] };
  type Tmpl = { corpo_html: string; nome: string; campos_paciente: unknown[] | null; campos_recepcao: unknown[] | null };

  const paciente = (c as unknown as { pacientes: Pac }).pacientes;
  const orc = (c as unknown as { orcamentos: Orc | null }).orcamentos;
  const tmpl = (c as unknown as { contratos_templates: Tmpl | null }).contratos_templates;

  if (!tmpl) return NextResponse.json({ error: 'Template não encontrado' }, { status: 400 });

  // Extrair dados_recepcao do body
  const dados_recepcao: Record<string, unknown> = body.dados_recepcao ?? {};

  // Validar campos obrigatórios da recepção
  if (Array.isArray(tmpl.campos_recepcao)) {
    const faltando = (tmpl.campos_recepcao as { key: string; label: string }[])
      .filter(cf => {
        const v = dados_recepcao[cf.key];
        return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
      });
    if (faltando.length > 0) {
      return NextResponse.json({ error: `Preencha os campos obrigatórios: ${faltando.map(f => f.label).join(', ')}`, campos_faltando: faltando.map(f => f.key) }, { status: 400 });
    }
  }

  const itens = (orc?.orcamento_itens ?? []).filter(i => i.selecionado);

  const { data: clinicaCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'clinica').single();
  const clinicaNome = (clinicaCfg?.valor as { nome?: string } | null)?.nome ?? 'Clínica Odontológica';

  const temCamposPaciente = Array.isArray(tmpl.campos_paciente) && tmpl.campos_paciente.length > 0;

  const templateData = {
    paciente: { nome: paciente.nome, cpf: paciente.cpf, email: paciente.email, telefone: paciente.telefone, endereco: paciente.endereco },
    orcamento: orc ? { ...orc, status: 'aprovado' } as never : null,
    itens: itens as never,
    extras: dados_recepcao,
    clinica_nome: clinicaNome,
  };

  // Se há campos do paciente: renderiza parcialmente (eles ficam como "a preencher")
  const htmlRendered = temCamposPaciente
    ? renderTemplateParcial(tmpl.corpo_html, templateData)
    : renderTemplate(tmpl.corpo_html, templateData);

  const docHash = crypto.createHash('sha256').update(htmlRendered).digest('hex');

  const token = crypto.randomUUID();
  const secret = getSigningSecret();
  const tokenHmac = crypto.createHmac('sha256', secret).update(token).digest('hex');
  const tokenExp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Salvar HTML original no Storage via service role (bypassa RLS)
  // URL server-side: prefere SUPABASE_URL (server-only), cai em NEXT_PUBLIC_SUPABASE_URL
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient: createServiceClient } = await import('@supabase/supabase-js');
      const adminStorage = createServiceClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const htmlBytes = Buffer.from(htmlRendered, 'utf-8');
      const { error: uploadErr } = await adminStorage.storage.from('contratos-html').upload(`${id}/original.html`, htmlBytes, {
        contentType: 'text/html; charset=utf-8',
        upsert: true,
      });
      if (uploadErr) {
        console.error('[gerar-link] Falha no upload do HTML para Storage (não bloqueante):', uploadErr.message);
      }
    } catch (e) {
      console.error('[gerar-link] Exceção no upload Storage:', e);
    }
  } else {
    console.warn('[gerar-link] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes — upload Storage ignorado.');
  }

  const { error: updateErr } = await supabase.from('contratos').update({
    status: 'enviado',
    enviado_em: new Date().toISOString(),
    sign_token: token,
    sign_token_hmac: tokenHmac,
    sign_token_exp: tokenExp,
    doc_hash: docHash,
    corpo_html_final: htmlRendered,
    // Campos do paciente: salva template original + definição dos campos para uso na página de assinatura
    html_template_parcial: temCamposPaciente ? tmpl.corpo_html : null,
    campos_paciente: temCamposPaciente ? tmpl.campos_paciente : null,
    dados_paciente_extras: temCamposPaciente ? null : null,
  }).eq('id', id);

  if (updateErr) return NextResponse.json({ error: 'Erro ao salvar token' }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  return NextResponse.json({ sign_url: `${appUrl}/assinar/${token}`, sign_token_exp: tokenExp });
}
