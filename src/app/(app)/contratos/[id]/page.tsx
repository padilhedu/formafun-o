import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import type { Contrato } from '@/types/contratos';
import { CONTRATO_STATUS_CONFIG } from '@/types/contratos';
import { PainelAssinatura } from '@/components/contratos/PainelAssinatura';

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
          <p style={{ fontSize: 10, fontFamily: 'var(--font-montserrat)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1F7A4D', marginBottom: 4 }}>COMERCIAL</p>
          <div className="flex items-center gap-4 mb-2 flex-wrap">
            <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 28, fontWeight: 600, color: '#1C1C1C', lineHeight: 1.1 }}>
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
        <a href={`/api/contratos/${c.id}/pdf?print=1`} target="_blank" className="btn-ghost text-xs" style={{ padding: '6px 14px' }}>
          Imprimir / PDF
        </a>
      </div>

      {/* Layout: timeline + preview */}
      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
        {/* Left: painel de assinatura + info */}
        <div className="space-y-4">
          <div style={{ borderRadius: 14, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', padding: 16 }}>
            <PainelAssinatura contrato={c as unknown as Parameters<typeof PainelAssinatura>[0]['contrato']} />
          </div>

          {/* Patient info */}
          <div style={{ borderRadius: 14, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', padding: 16 }}>
            <p className="text-muted mb-3" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Paciente
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
        <div style={{ borderRadius: 14, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', padding: 0, overflow: 'hidden' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', fontWeight: 600, letterSpacing: '0.05em', color: '#6B6B66', textTransform: 'uppercase' }}>
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
