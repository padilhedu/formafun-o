import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { ContratoComRelacoes, ContratoStatus } from '@/types/contratos';
import { CONTRATO_STATUS_CONFIG } from '@/types/contratos';

export const dynamic = 'force-dynamic';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR');
}

export default async function ContratosPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <div className="text-muted p-8">Configure o Supabase.</div>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('contratos')
    .select('*, pacientes(nome, cpf, email, telefone), orcamentos(codigo, valor_total)')
    .order('created_at', { ascending: false });

  const contratos = (data as ContratoComRelacoes[]) ?? [];

  const byStatus = contratos.reduce<Partial<Record<ContratoStatus, number>>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="heading text-4xl text-offwhite mb-1" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Contratos
          </h1>
          <p className="text-muted text-sm">Assinatura digital via ZapSign</p>
        </div>
        <Link href="/configuracoes/templates" className="btn-ghost text-xs" style={{ padding: '7px 14px' }}>
          Gerenciar Templates
        </Link>
      </div>

      {/* Status summary */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {(Object.keys(CONTRATO_STATUS_CONFIG) as ContratoStatus[]).map(status => {
          const cfg = CONTRATO_STATUS_CONFIG[status];
          const count = byStatus[status] ?? 0;
          return (
            <div key={status} className="card flex items-center gap-3" style={{ padding: '12px 18px', minWidth: 120 }}>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
              <div>
                <div style={{ fontSize: 11, color: cfg.color, fontFamily: 'var(--font-montserrat)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {cfg.label}
                </div>
                <div className="text-offwhite font-bold" style={{ fontFamily: 'var(--font-montserrat)', fontSize: 18 }}>{count}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* List */}
      {contratos.length === 0 ? (
        <div className="card text-center py-16" style={{ borderStyle: 'dashed', borderColor: 'rgba(184,154,90,0.15)' }}>
          <div className="text-3xl mb-3" style={{ fontFamily: 'var(--font-cormorant)', color: '#8A8A93' }}>Sem contratos</div>
          <p className="text-muted text-sm">Gere um contrato a partir de um orçamento aprovado.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Código', 'Paciente', 'Orçamento', 'Status', 'Enviado em', 'Assinado em', ''].map(h => (
                  <th key={h} className="table-header" style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contratos.map(c => {
                const cfg = CONTRATO_STATUS_CONFIG[c.status];
                return (
                  <tr key={c.id} className="table-row-hover" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="text-gold font-medium" style={{ fontSize: 12, fontFamily: 'var(--font-montserrat)' }}>
                        {c.codigo}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Link href={`/pacientes/${c.paciente_id}`} className="text-offwhite hover:text-gold transition-colors" style={{ fontSize: 13 }}>
                        {c.pacientes?.nome ?? '—'}
                      </Link>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {c.orcamento_id ? (
                        <Link href={`/orcamentos/${c.orcamento_id}`} className="text-muted hover:text-offwhite transition-colors" style={{ fontSize: 12 }}>
                          {c.orcamentos?.codigo ?? '—'}
                        </Link>
                      ) : (
                        <span className="text-muted text-sm">—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 10 }}>
                        {cfg.label.toUpperCase()}
                      </span>
                      {c.status === 'assinado' && (
                        <div className="mt-1" style={{ fontSize: 9, color: '#4ADE80' }}>✓ Travado</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="text-muted text-sm">{c.enviado_em ? formatDate(c.enviado_em) : '—'}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: c.assinado_em ? '#4ADE80' : '#8A8A93', fontSize: 13 }}>
                        {c.assinado_em ? formatDate(c.assinado_em) : '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <Link href={`/contratos/${c.id}`} className="text-gold" style={{ fontSize: 12, fontFamily: 'var(--font-montserrat)' }}>
                        Ver →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
