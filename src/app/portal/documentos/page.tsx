import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    assinado:    { label: '✓ Assinado', color: '#4ADE80', bg: 'rgba(74,222,128,0.1)' },
    enviado:     { label: '⏳ Aguardando assinatura', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
    visualizado: { label: '👁 Visualizado', color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
    rascunho:    { label: 'Pendente', color: '#8A8A93', bg: 'rgba(138,138,147,0.1)' },
  };
  const c = cfg[status] ?? cfg.rascunho;
  return (
    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5, background: c.bg, color: c.color, fontFamily: 'var(--font-montserrat)', fontWeight: 600 }}>
      {c.label}
    </span>
  );
}

export default async function PortalDocumentosPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/portal/login');

  const { data: acesso } = await sb.from('portal_acessos').select('paciente_id').eq('user_id', user.id).single();
  if (!acesso) redirect('/portal');

  const { data: contratos } = await sb
    .from('contratos')
    .select('id, codigo, status, assinado_em, pdf_url, zapsign_doc_url, created_at, categoria_documento')
    .eq('paciente_id', acesso.paciente_id)
    .order('created_at', { ascending: false });

  const docs = contratos ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/portal" style={{ color: '#8A8A93', fontSize: 13 }}>← Início</Link>
      </div>
      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.6rem', color: '#B89A5A', fontWeight: 600, margin: 0 }}>
        Meus Documentos
      </h1>

      {docs.length === 0 && (
        <div className="card p-8 text-center">
          <p style={{ color: '#8A8A93', fontSize: 13 }}>Nenhum documento disponível.</p>
        </div>
      )}

      {docs.map(c => (
        <div key={c.id} className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <p style={{ fontSize: 13, color: '#F5F2EA', fontFamily: 'var(--font-montserrat)', fontWeight: 600, margin: 0 }}>
                {c.codigo}
              </p>
              <p style={{ fontSize: 11, color: '#8A8A93', marginTop: 3 }}>
                {c.categoria_documento === 'tcle' ? 'Termo de Consentimento' : 'Contrato'} ·{' '}
                {new Date(c.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <StatusBadge status={c.status} />
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {c.zapsign_doc_url && c.status !== 'assinado' && (
              <a href={c.zapsign_doc_url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '7px 16px', fontSize: 12, textDecoration: 'none' }}>
                Assinar agora →
              </a>
            )}
            {c.pdf_url && (
              <a href={c.pdf_url} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ padding: '7px 16px', fontSize: 12, textDecoration: 'none' }}>
                ↓ Baixar PDF
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
