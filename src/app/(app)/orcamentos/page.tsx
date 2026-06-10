import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { OrcamentoComPaciente, OrcamentoStatus } from '@/types/orcamentos';
import { STATUS_CONFIG } from '@/types/orcamentos';
import { StatusBadge } from '@/components/orcamentos/StatusBadge';

export const dynamic = 'force-dynamic';

const COLUNAS: OrcamentoStatus[] = ['rascunho', 'enviado', 'negociacao', 'aprovado', 'recusado'];

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function OrcamentosPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <div className="text-muted p-8">Configure o Supabase.</div>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('orcamentos')
    .select('*, pacientes(nome, cpf, telefone)')
    .not('status', 'eq', 'expirado')
    .order('criado_em', { ascending: false });

  const orcamentos = (data as OrcamentoComPaciente[]) ?? [];

  const byStatus = COLUNAS.reduce<Record<OrcamentoStatus, OrcamentoComPaciente[]>>((acc, s) => {
    acc[s] = orcamentos.filter(o => o.status === s);
    return acc;
  }, {} as Record<OrcamentoStatus, OrcamentoComPaciente[]>);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="heading text-4xl text-offwhite mb-1" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Orçamentos
          </h1>
          <p className="text-muted text-sm">Pipeline de orçamentos por status</p>
        </div>
        <Link href="/orcamentos/novo" className="btn-primary text-sm" style={{ padding: '8px 20px' }}>
          + Novo Orçamento
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {COLUNAS.map(status => {
          const lista = byStatus[status];
          const total = lista.reduce((s, o) => s + o.valor_total, 0);
          const cfg = STATUS_CONFIG[status];
          return (
            <div key={status} className="card" style={{ padding: '14px 16px' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                <span className="text-muted" style={{ fontSize: 10, fontFamily: 'var(--font-montserrat)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {cfg.label}
                </span>
              </div>
              <div className="text-offwhite font-bold" style={{ fontSize: 20, fontFamily: 'var(--font-montserrat)' }}>
                {lista.length}
              </div>
              <div style={{ color: cfg.color, fontSize: 11, fontFamily: 'var(--font-montserrat)', marginTop: 2 }}>
                {formatBRL(total)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ alignItems: 'flex-start' }}>
        {COLUNAS.map(status => {
          const lista = byStatus[status];
          const cfg = STATUS_CONFIG[status];
          return (
            <div key={status} style={{ minWidth: 260, width: 260, flexShrink: 0 }}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: cfg.color, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase' }}>
                  {cfg.label}
                </span>
                <span className="ml-auto text-muted" style={{ fontSize: 11 }}>{lista.length}</span>
              </div>
              <div className="space-y-2">
                {lista.length === 0 && (
                  <div style={{ padding: '20px 16px', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.07)', textAlign: 'center' }}>
                    <span className="text-muted" style={{ fontSize: 12 }}>Sem orçamentos</span>
                  </div>
                )}
                {lista.map(orc => (
                  <Link key={orc.id} href={`/orcamentos/${orc.id}`} className="block card" style={{ padding: '14px 16px', textDecoration: 'none' }}>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-gold" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', fontWeight: 600 }}>
                        {orc.codigo}
                      </span>
                      {orc.travado && (
                        <span style={{ fontSize: 9, background: 'rgba(74,222,128,0.1)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 4, padding: '1px 6px', fontFamily: 'var(--font-montserrat)' }}>
                          TRAVADO
                        </span>
                      )}
                    </div>
                    <div className="text-offwhite mb-2" style={{ fontSize: 13, fontFamily: 'var(--font-montserrat)', fontWeight: 500 }}>
                      {orc.pacientes?.nome ?? '—'}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted" style={{ fontSize: 11 }}>
                        {new Date(orc.criado_em).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-offwhite font-semibold" style={{ fontSize: 13, fontFamily: 'var(--font-montserrat)' }}>
                        {formatBRL(orc.valor_total)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full list */}
      {orcamentos.length > 0 && (
        <div className="mt-8">
          <h2 className="text-muted mb-4" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Todos os orçamentos
          </h2>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Código', 'Paciente', 'Status', 'Validade', 'Total', ''].map(h => (
                    <th key={h} className="table-header" style={{ padding: '10px 16px', textAlign: h === 'Total' ? 'right' : 'left', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orcamentos.map(orc => (
                  <tr key={orc.id} className="table-row-hover" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="text-gold font-medium" style={{ fontSize: 12, fontFamily: 'var(--font-montserrat)' }}>{orc.codigo}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="text-offwhite" style={{ fontSize: 13 }}>{orc.pacientes?.nome ?? '—'}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={orc.status} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="text-muted text-sm">{orc.validade ? new Date(orc.validade).toLocaleDateString('pt-BR') : '—'}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span className="text-offwhite font-medium" style={{ fontFamily: 'var(--font-montserrat)', fontSize: 13 }}>{formatBRL(orc.valor_total)}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <Link href={`/orcamentos/${orc.id}`} className="text-gold" style={{ fontSize: 12, fontFamily: 'var(--font-montserrat)' }}>
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
