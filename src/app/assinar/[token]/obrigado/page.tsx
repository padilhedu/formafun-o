import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contrato Assinado', robots: 'noindex' };

export default async function ObrigadoPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ email?: string }> }) {
  const { token } = await params;
  const { email } = await searchParams;

  const supabase = await createClient();
  const { data: c } = await supabase
    .from('contratos')
    .select('id, codigo, assinado_em')
    .eq('sign_token', token)
    .single();

  const { data: clinicaCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'clinica').single();
  const clinica = (clinicaCfg?.valor as { nome?: string; telefone?: string } | null) ?? {};

  const emailMascarado = email ? email.replace(/(.{2}).*(@.*)/, '$1***$2') : null;

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Topbar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#121214', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '12px 20px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontFamily: 'var(--font-cormorant,serif)', fontSize: 17, color: '#B89A5A', fontWeight: 600 }}>{clinica.nome ?? 'Clínica Odontológica'}</p>
      </div>

      <div style={{ width: '100%', maxWidth: 440, background: '#121214', borderRadius: 20, padding: 36, border: '1px solid rgba(74,222,128,0.25)', marginTop: 60, textAlign: 'center' }}>
        {/* Check icon */}
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(74,222,128,0.12)', border: '2px solid rgba(74,222,128,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>
          ✓
        </div>

        <h1 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 26, color: '#4ADE80', margin: '0 0 8px', fontWeight: 600 }}>
          Contrato assinado com sucesso!
        </h1>

        {c && (
          <p style={{ fontSize: 13, color: '#8A8A93', fontFamily: 'var(--font-montserrat,sans-serif)', margin: '0 0 20px' }}>
            {c.codigo} · {c.assinado_em ? new Date(c.assinado_em).toLocaleString('pt-BR') : ''}
          </p>
        )}

        {emailMascarado && (
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ fontSize: 13, color: '#D9C9A3', fontFamily: 'var(--font-montserrat,sans-serif)', margin: 0 }}>
              Enviamos uma cópia do PDF para<br />
              <strong>{emailMascarado}</strong>
            </p>
          </div>
        )}

        <p style={{ fontSize: 13, color: '#D9C9A3', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: 24, lineHeight: 1.6 }}>
          Em breve nossa equipe entrará em contato.
        </p>

        {c && (
          <a
            href={`/api/contratos/${c.id}/download-publico?token=${token}`}
            style={{ display: 'block', width: '100%', padding: '14px', borderRadius: 10, background: '#B89A5A', color: '#0A0A0B', fontWeight: 700, fontSize: 15, textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)', boxSizing: 'border-box' }}
          >
            Baixar PDF agora
          </a>
        )}

        {clinica.telefone && (
          <p style={{ marginTop: 24, fontSize: 11, color: '#8A8A93', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            Dúvidas? Contate a clínica: {clinica.telefone}
          </p>
        )}
      </div>
    </div>
  );
}
