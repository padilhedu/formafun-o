import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contrato Recusado', robots: 'noindex' };

export default async function RecusadoPage() {
  const supabase = await createClient();
  const { data: clinicaCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'clinica').single();
  const clinica = (clinicaCfg?.valor as { nome?: string; telefone?: string; email?: string } | null) ?? {};

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#121214', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '12px 20px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontFamily: 'var(--font-cormorant,serif)', fontSize: 17, color: '#1F7A4D', fontWeight: 600 }}>{clinica.nome ?? 'Clínica Odontológica'}</p>
      </div>

      <div style={{ width: '100%', maxWidth: 440, background: '#121214', borderRadius: 20, padding: 36, border: '1px solid rgba(248,113,113,0.25)', marginTop: 60, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(248,113,113,0.1)', border: '2px solid rgba(248,113,113,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#F87171" strokeWidth="2.5"><path d="M7 7l14 14M21 7L7 21" strokeLinecap="round"/></svg>
        </div>
        <h1 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 26, color: '#F87171', margin: '0 0 12px', fontWeight: 600 }}>
          Contrato recusado
        </h1>
        <p style={{ fontSize: 14, color: '#D9C9A3', fontFamily: 'var(--font-montserrat,sans-serif)', lineHeight: 1.6, marginBottom: 24 }}>
          Recebemos sua recusa. Nossa equipe será notificada e entrará em contato para entender suas dúvidas e encontrar uma solução.
        </p>
        {(clinica.telefone || clinica.email) && (
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ fontSize: 13, color: '#D9C9A3', fontFamily: 'var(--font-montserrat,sans-serif)', margin: 0 }}>
              Contato da clínica:
              {clinica.telefone && <><br /><strong>{clinica.telefone}</strong></>}
              {clinica.email && <><br /><a href={`mailto:${clinica.email}`} style={{ color: '#1F7A4D' }}>{clinica.email}</a></>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
