import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import type { Contrato } from '@/types/contratos';
import { CONTRATO_STATUS_CONFIG } from '@/types/contratos';
import { ContratoTimeline } from '@/components/contratos/ContratoTimeline';
import { ContratoAcoes } from '@/components/contratos/ContratoAcoes';

export const dynamic = 'force-dynamic';

interface ContratoFull extends Contrato {
  pacientes: { nome: string; cpf: string | null; email: string | null; telefone: string | null } | null;
  orcamentos: { codigo: string; valor_total: number; status: string } | null;
}

export default async function ContratoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return <div className="text-muted p-8">Configure o Supabase.</div>;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } = await supabase
    .from('contratos')
    .select('*, pacientes(nome, cpf, email, telefone), orcamentos(codigo, valor_total, status)')
    .eq('id', id)
    .single();

  if (error || !data) notFound();
  const c = data as unknown as ContratoFull;
  const cfg = CONTRATO_STATUS_CONFIG[c.status];

  return (
    <div>
      {/* Signed banner */}
      {c.status === 'assinado' && (
        <div className="mb-6 px-5 py-3 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.25)' }}>
          <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
          <span className="text-success font-medium" style={{ fontFamily: 'var(--font-montserrat)', fontSize: 13 }}>
            Contrato assinado em {c.assinado_em ? new Date(c.assinado_em).toLocaleString('pt-BR') : '—'} — Orçamento travado automaticamente
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="mb-2">
            <Link href="/contratos" className="text-muted hover:text-offwhite transition-colors" style={{ fontSize: 13 }}>
              ← Contratos
            </Link>
          </div>
          <div className="flex items-center gap-4 mb-2 flex-wrap">
            <h1 className="heading text-3xl text-offwhite" style={{ fontFamily: 'var(--font-cormorant)' }}>
              {c.codigo}
            </h1>
            <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
              {cfg.label.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Link href={`/pacientes/${c.paciente_id}`} className="text-offwhite hover:text-gold transition-colors" style={{ fontFamily: 'var(--font-montserrat)', fontSize: 14, fontWeight: 500 }}>
              {c.pacientes?.nome ?? '—'}
            </Link>
            {c.pacientes?.cpf && <span className="text-muted text-sm">CPF {c.pacientes.cpf}</span>}
            {c.orcamento_id && (
              <Link href={`/orcamentos/${c.orcamento_id}`} className="text-muted hover:text-gold transition-colors text-sm">
                {c.orcamentos?.codigo}
              </Link>
            )}
          </div>
        </div>
        <ContratoAcoes contratoId={c.id} status={c.status} pdfToken={c.token_publico} />
      </div>

      {/* Layout: timeline + preview */}
      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
        {/* Left: timeline + info */}
        <div className="space-y-4">
          <ContratoTimeline status={c.status} enviadoEm={c.enviado_em} assinadoEm={c.assinado_em} />

          {/* ZapSign link */}
          {c.zapsign_doc_url && c.status !== 'assinado' && (
            <div className="card" style={{ padding: 16 }}>
              <p className="text-muted mb-2" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Link de Assinatura
              </p>
              <a
                href={c.zapsign_doc_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold text-sm break-all"
                style={{ fontFamily: 'var(--font-montserrat)' }}
              >
                Abrir no ZapSign →
              </a>
            </div>
          )}

          {/* PDF signed */}
          {c.pdf_url && (
            <div className="card" style={{ padding: 16, border: '1px solid rgba(74,222,128,0.25)' }}>
              <p className="text-muted mb-2" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                PDF Assinado
              </p>
              <a href={c.pdf_url} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs block text-center">
                Baixar PDF →
              </a>
            </div>
          )}

          {/* Patient info */}
          <div className="card" style={{ padding: 16 }}>
            <p className="text-muted mb-3" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Signatário
            </p>
            <div className="space-y-2">
              <div>
                <span className="text-muted" style={{ fontSize: 10 }}>Nome</span>
                <p className="text-offwhite text-sm">{c.pacientes?.nome ?? '—'}</p>
              </div>
              <div>
                <span className="text-muted" style={{ fontSize: 10 }}>E-mail</span>
                <p className="text-offwhite text-sm">{c.pacientes?.email ?? '—'}</p>
              </div>
              <div>
                <span className="text-muted" style={{ fontSize: 10 }}>Telefone</span>
                <p className="text-offwhite text-sm">{c.pacientes?.telefone ?? '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: contract HTML preview */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', fontWeight: 600, letterSpacing: '0.05em', color: '#8A8A93', textTransform: 'uppercase' }}>
              Visualização do Contrato
            </span>
            <a
              href={`/api/contratos/${c.id}/pdf?print=1`}
              target="_blank"
              className="btn-ghost text-xs"
              style={{ padding: '4px 12px' }}
            >
              Imprimir / PDF
            </a>
          </div>
          <iframe
            src={`/api/contratos/${c.id}/pdf`}
            style={{ width: '100%', height: 600, border: 'none', background: '#fff' }}
            title="Visualização do contrato"
          />
        </div>
      </div>
    </div>
  );
}
