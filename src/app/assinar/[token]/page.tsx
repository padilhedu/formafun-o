import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AssinarClient } from './SignarClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Assinar Contrato', robots: 'noindex' };

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

  const safeHtml = rawHtml; // sanitização feita no client via DOMPurify (browser DOM)

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
  const icon = cor === '#4ADE80'
    ? <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke={cor} strokeWidth="2.5"><path d="M5 14l6 6L23 8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    : cor === '#F87171'
    ? <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke={cor} strokeWidth="2.5"><path d="M7 7l14 14M21 7L7 21" strokeLinecap="round"/></svg>
    : <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke={cor} strokeWidth="2.5"><path d="M14 10v5M14 18h.01" strokeLinecap="round"/><path d="M12 5L3 21h18L12 5z" strokeLinejoin="round"/></svg>;

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#121214', borderRadius: 16, padding: 32, border: `1px solid ${cor}40`, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${cor}18`, border: `2px solid ${cor}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          {icon}
        </div>
        <h1 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 24, color: cor, margin: '0 0 12px' }}>{titulo}</h1>
        <p style={{ fontSize: 14, color: '#D9C9A3', fontFamily: 'var(--font-montserrat,sans-serif)', lineHeight: 1.6, margin: 0 }}>{mensagem}</p>
      </div>
    </div>
  );
}
