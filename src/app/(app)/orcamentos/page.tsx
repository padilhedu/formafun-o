import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { OrcamentoComPaciente, OrcamentoStatus } from '@/types/orcamentos';
import { StatusChip } from '@/components/ui/StatusChip';
import { DataTable } from '@/components/ui/DataTable';
import { KpiCard } from '@/components/ui/KpiCard';

export const dynamic = 'force-dynamic';

const COLUNAS: OrcamentoStatus[] = ['rascunho', 'enviado', 'negociacao', 'aprovado', 'recusado'];

const STATUS_LABEL: Record<OrcamentoStatus, string> = {
  rascunho: 'Rascunho', enviado: 'Enviado', negociacao: 'Negociação',
  aprovado: 'Aprovado', recusado: 'Recusado', expirado: 'Expirado',
};

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function OrcamentosPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <div style={{ padding: 32, color: '#6B6B66' }}>Configure o Supabase.</div>;
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
  const total = orcamentos.reduce((s, o) => s + o.valor_total, 0);
  const aprovados = orcamentos.filter(o => o.status === 'aprovado');
  const pendentes = orcamentos.filter(o => ['enviado', 'negociacao'].includes(o.status));

  const byStatus = COLUNAS.reduce<Record<OrcamentoStatus, OrcamentoComPaciente[]>>((acc, s) => {
    acc[s] = orcamentos.filter(o => o.status === s);
    return acc;
  }, {} as Record<OrcamentoStatus, OrcamentoComPaciente[]>);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 10, fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#6B6B66', marginBottom: 4 }}>
            COMERCIAL
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, color: '#1C1C1C', lineHeight: 1.1, marginBottom: 4 }}>
            Orçamentos
          </h1>
          <p style={{ fontSize: 13, color: '#6B6B66', fontFamily: 'var(--font-body)' }}>
            {orcamentos.length} orçamentos · pipeline {formatBRL(total)}
          </p>
        </div>
        <Link
          href="/orcamentos/novo"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px',
            borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
            background: '#1F7A4D', color: '#FFFFFF', textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(31,122,77,0.25)',
          }}
        >
          + Novo Orçamento
        </Link>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <KpiCard label="Pipeline Total" value={formatBRL(total)} trend="neutral" />
        <KpiCard
          label="Aprovados"
          value={String(aprovados.length)}
          sub={formatBRL(aprovados.reduce((s, o) => s + o.valor_total, 0))}
          trend="up"
        />
        <KpiCard
          label="Em Negociação"
          value={String(pendentes.length)}
          sub={formatBRL(pendentes.reduce((s, o) => s + o.valor_total, 0))}
          trend="neutral"
        />
        <KpiCard
          label="Recusados"
          value={String(orcamentos.filter(o => o.status === 'recusado').length)}
          trend={orcamentos.filter(o => o.status === 'recusado').length > 0 ? 'down' : 'neutral'}
        />
      </div>

      {/* Kanban horizontal */}
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 12, alignItems: 'flex-start', marginBottom: 32 }}>
        {COLUNAS.map(status => {
          const lista = byStatus[status];
          return (
            <div key={status} style={{ minWidth: 240, width: 240, flexShrink: 0 }}>
              {/* Coluna header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingLeft: 2 }}>
                <StatusChip status={status} type="orcamento" size="sm" />
                <span style={{
                  marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--font-body)', fontWeight: 700,
                  background: 'rgba(0,0,0,0.06)', color: '#6B6B66', borderRadius: 20, padding: '1px 8px',
                }}>
                  {lista.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lista.length === 0 && (
                  <div style={{ padding: '20px 14px', borderRadius: 12, border: '1px dashed rgba(0,0,0,0.10)', textAlign: 'center' }}>
                    <span style={{ fontSize: 12, color: '#6B6B66', fontFamily: 'var(--font-body)' }}>Sem orçamentos</span>
                  </div>
                )}
                {lista.map(orc => (
                  <Link
                    key={orc.id}
                    href={`/orcamentos/${orc.id}`}
                    style={{
                      display: 'block', padding: '12px 14px', borderRadius: 12,
                      background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      textDecoration: 'none', transition: 'box-shadow 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(31,122,77,0.10)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(31,122,77,0.25)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.08)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-body)', fontWeight: 700, color: '#1F7A4D', letterSpacing: '0.04em' }}>
                        {orc.codigo}
                      </span>
                      {orc.travado && (
                        <span style={{ fontSize: 9, background: 'rgba(31,122,77,0.10)', color: '#1F7A4D', border: '1px solid rgba(31,122,77,0.25)', borderRadius: 4, padding: '1px 6px', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                          TRAVADO
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 500, color: '#1C1C1C', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {orc.pacientes?.nome ?? '—'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: '#6B6B66', fontFamily: 'var(--font-body)' }}>
                        {new Date(orc.criado_em).toLocaleDateString('pt-BR')}
                      </span>
                      <span style={{ fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600, color: '#1C1C1C', fontVariantNumeric: 'tabular-nums' }}>
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

      {/* Lista completa */}
      {orcamentos.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B66', marginBottom: 12 }}>
            Todos os orçamentos
          </p>
          <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <DataTable
              columns={[
                { key: 'codigo', header: 'Código', render: (o) => (
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700, color: '#1F7A4D' }}>{(o as OrcamentoComPaciente).codigo}</span>
                )},
                { key: 'paciente', header: 'Paciente', render: (o) => (
                  <span style={{ fontSize: 13, color: '#1C1C1C', fontFamily: 'var(--font-body)' }}>{(o as OrcamentoComPaciente).pacientes?.nome ?? '—'}</span>
                )},
                { key: 'status', header: 'Status', render: (o) => (
                  <StatusChip status={(o as OrcamentoComPaciente).status} type="orcamento" size="sm" />
                )},
                { key: 'validade', header: 'Validade', render: (o) => (
                  <span style={{ fontSize: 12, color: '#6B6B66', fontFamily: 'var(--font-body)', fontVariantNumeric: 'tabular-nums' }}>
                    {(o as OrcamentoComPaciente).validade ? new Date((o as OrcamentoComPaciente).validade!).toLocaleDateString('pt-BR') : '—'}
                  </span>
                )},
                { key: 'valor_total', header: 'Total', render: (o) => (
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600, color: '#1C1C1C', fontVariantNumeric: 'tabular-nums' }}>
                    {formatBRL((o as OrcamentoComPaciente).valor_total)}
                  </span>
                )},
                { key: 'acao', header: '', render: (o) => (
                  <Link href={`/orcamentos/${(o as OrcamentoComPaciente).id}`} style={{ fontSize: 12, color: '#1F7A4D', fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'none' }}>
                    Ver →
                  </Link>
                )},
              ]}
              data={orcamentos}
              pageSize={15}
              emptyMessage="Nenhum orçamento encontrado."
            />
          </div>
        </div>
      )}
    </div>
  );
}
