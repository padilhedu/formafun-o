import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderTemplate } from '@/lib/template-render';
import crypto from 'crypto';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Falhar explicitamente se o segredo HMAC não estiver configurado
  if (!process.env.SIGNING_HMAC_SECRET) {
    console.error('[gerar-link] SIGNING_HMAC_SECRET não definida. Configure a variável de ambiente.');
    return NextResponse.json({ error: 'Configuração de assinatura ausente no servidor (SIGNING_HMAC_SECRET).' }, { status: 500 });
  }

  const { id } = await params;
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
      contratos_templates(corpo_html, nome)
    `)
    .eq('id', id)
    .single();

  if (error || !c) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });
  if (c.status !== 'rascunho') return NextResponse.json({ error: 'Só é possível gerar link para contratos em rascunho' }, { status: 400 });

  type Pac = { nome: string; cpf: string | null; email: string | null; telefone: string | null; endereco: Record<string, string> | null };
  type Orc = { id: string; codigo: string; valor_total: number; validade: string | null; observacoes: string | null; clausulas_adicionais: string | null; orcamento_itens: { descricao: string; dente: string | null; face: string | null; qtde: number; valor_unitario: number; total: number; selecionado: boolean; categoria: string | null }[] };
  type Tmpl = { corpo_html: string; nome: string };

  const paciente = (c as unknown as { pacientes: Pac }).pacientes;
  const orc = (c as unknown as { orcamentos: Orc | null }).orcamentos;
  const tmpl = (c as unknown as { contratos_templates: Tmpl | null }).contratos_templates;

  if (!tmpl) return NextResponse.json({ error: 'Template não encontrado' }, { status: 400 });

  const itens = (orc?.orcamento_itens ?? []).filter(i => i.selecionado);

  const htmlRendered = renderTemplate(tmpl.corpo_html, {
    paciente: { nome: paciente.nome, cpf: paciente.cpf, email: paciente.email, telefone: paciente.telefone, endereco: paciente.endereco },
    orcamento: orc ? { ...orc, status: 'aprovado' } as never : null,
    itens: itens as never,
  });

  const docHash = crypto.createHash('sha256').update(htmlRendered).digest('hex');

  const token = crypto.randomUUID();
  // SIGNING_HMAC_SECRET já foi verificada no guard acima — nunca é undefined aqui
  const tokenHmac = crypto.createHmac('sha256', process.env.SIGNING_HMAC_SECRET!).update(token).digest('hex');
  const tokenExp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Salvar HTML original no Storage via service role (bypassa RLS)
  const { createClient: createServiceClient } = await import('@supabase/supabase-js');
  const adminStorage = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const htmlBytes = Buffer.from(htmlRendered, 'utf-8');
  const { error: uploadErr } = await adminStorage.storage.from('contratos-html').upload(`${id}/original.html`, htmlBytes, {
    contentType: 'text/html; charset=utf-8',
    upsert: true,
  });
  if (uploadErr) {
    console.error('[gerar-link] Falha no upload do HTML para Storage:', uploadErr.message);
    return NextResponse.json({
      error: 'Bucket "contratos-html" não encontrado ou sem permissão. Crie-o no painel Supabase (privado) e rode scripts/setup-storage-buckets.ts.',
    }, { status: 500 });
  }

  const { error: updateErr } = await supabase.from('contratos').update({
    status: 'enviado',
    enviado_em: new Date().toISOString(),
    sign_token: token,
    sign_token_hmac: tokenHmac,
    sign_token_exp: tokenExp,
    doc_hash: docHash,
    // Regravar corpo_html_final com o HTML renderizado neste momento,
    // garantindo que preview PDF e documento assinado sejam idênticos.
    corpo_html_final: htmlRendered,
  }).eq('id', id);

  if (updateErr) return NextResponse.json({ error: 'Erro ao salvar token' }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  return NextResponse.json({ sign_url: `${appUrl}/assinar/${token}` });
}
