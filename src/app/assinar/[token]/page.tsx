import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import { AssinarClient } from './SignarClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Assinar Contrato', robots: 'noindex' };

function sanitizeHtml(html: string): string {
  const { window } = new JSDOM('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const purify = DOMPurify(window as unknown as any);
  return purify.sanitize(html, {
    ALLOWED_TAGS: ['p','br','strong','em','u','h1','h2','h3','h4','table','thead','tbody','tr','th','td','ul','ol','li','div','span'],
    ALLOWED_ATTR: ['style','colspan','rowspan'],
    FORBID_TAGS: ['script','iframe','object','embed','form','input','button'],
    FORBID_ATTR: ['onerror','onload','onclick','onmouseover'],
  });
}

export default async function AssinarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: c } = await supabase
    .from('contratos')
    .select('id, codigo, status, sign_token_exp, assinado_em, paciente_id, pacientes(nome, email), contratos_templates(corpo_html)')
    .eq('sign_token', token)
    .single();

  if (!c) return <ErroPagina titulo="Link inválido" mensagem="Este link de assinatura é inválido ou não existe." />;

  if (!c.sign_token_exp || new Date(c.sign_token_exp) < new Date()) {
    const { data: clinicaCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'clinica').single();
    const clinica = (clinicaCfg?.valor as { telefone?: string; email?: string } | null) ?? {};
    return <ErroPagina titulo="Link expirado" mensagem={`Este link de assinatura expirou. Entre em contato com a clínica: ${clinica.telefone ?? clinica.email ?? ''}`} />;
  }

  if (c.status === 'assinado') {
    const assinadoStr = c.assinado_em ? new Date(c.assinado_em).toLocaleDateString('pt-BR') : '';
    return <ErroPagina titulo="Contrato já assinado" mensagem={`Este contrato já foi assinado em ${assinadoStr}. Você receberá o PDF por e-mail.`} cor="#4ADE80" />;
  }

  if (c.status === 'recusado') {
    return <ErroPagina titulo="Contrato recusado" mensagem="Este contrato foi recusado. Entre em contato com a clínica para mais informações." cor="#F87171" />;
  }

  // Buscar HTML original do Storage
  type Tmpl = { corpo_html: string };
  const tmpl = (c as unknown as { contratos_templates: Tmpl | null }).contratos_templates;
  let rawHtml = tmpl?.corpo_html ?? '';
  try {
    const { data: htmlData } = await supabase.storage.from('contratos-html').download(`${c.id}/original.html`);
    if (htmlData) rawHtml = await htmlData.text();
  } catch {}

  const safeHtml = sanitizeHtml(rawHtml);

  const { data: clinicaCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'clinica').single();
  const clinica = (clinicaCfg?.valor as { nome?: string; telefone?: string } | null) ?? {};

  type Pac = { nome: string; email: string | null };
  const paciente = (c as unknown as { pacientes: Pac }).pacientes;

  return (
    <AssinarClient
      token={token}
      contratoId={c.id}
      contratoHtml={safeHtml}
      pacienteNome={paciente?.nome ?? ''}
      pacienteEmail={paciente?.email ?? null}
      clinicaNome={clinica.nome ?? 'Clínica Odontológica'}
      clinicaTelefone={clinica.telefone ?? ''}
    />
  );
}

function ErroPagina({ titulo, mensagem, cor = '#F87171' }: { titulo: string; mensagem: string; cor?: string }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#121214', borderRadius: 16, padding: 32, border: `1px solid ${cor}40`, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>{cor === '#4ADE80' ? '✓' : cor === '#F87171' ? '✕' : '⚠'}</div>
        <h1 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 24, color: cor, margin: '0 0 12px' }}>{titulo}</h1>
        <p style={{ fontSize: 14, color: '#D9C9A3', fontFamily: 'var(--font-montserrat,sans-serif)', lineHeight: 1.6, margin: 0 }}>{mensagem}</p>
      </div>
    </div>
  );
}
