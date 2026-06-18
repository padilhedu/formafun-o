import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { OrcamentoComPaciente, OrcamentoStatus } from '@/types/orcamentos';
import { STATUS_CONFIG } from '@/types/orcamentos';
import { StatusChip } from '@/components/ui/StatusChip';
import { KpiCard } from '@/components/dashboard/KpiCard';

export const dynamic = 'force-dynamic';

const TODOS_STATUS: OrcamentoStatus[] = ['rascunho', 'enviado', 'negociacao', 'aprovado', 'recusado', 'expirado'];

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(31,122,77,0.10)', border: '1px solid rgba(31,122,77,0.2)',
      fontSize: 10, fontWeight: 700, color: '#1F7A4D', fontFamily: 'var(--font-montserrat)',
    }}>
      {initials}
    </div>
  );
}

export default async function OrcamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <div className="text-muted p-8">Configure o Supabase.</div>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { status: filterStatus, q } = await searchParams;

  const { data } = await supabase
    .from('orcamentos')
    .select('*, pacientes(nome, cpf, telefone)')
    .order('criado_em', { ascending: false });

  const todos = (data as OrcamentoComPaciente[]) ?? [];

  // KPI totals (todos os status)
  const totalEmitido = todos.reduce((s, o) => s + o.valor_total, 0);
  const totalAprovado = todos.filter(o => o.status === 'aprovado').reduce((s, o) => s + o.valor_total, 0);
  const totalAberto = todos.filter(o => ['enviado', 'negociacao'].includes(o.status)).reduce((s, o) => s + o.valor_total, 0);
  const taxaAprovacao = todos.length > 0
    ? Math.round((todos.filter(o => o.status === 'aprovado').length / todos.length) * 100)
    : 0;

  // Contagens por status para pills
  const countPorStatus = TODOS_STATUS.reduce<Record<string, number>>((acc, s) => {
    acc[s] = todos.filter(o => o.status === s).length;
    return acc;
  }, {});

  // Filtrar lista
  let lista = filterStatus && filterStatus !== 'todos' ? todos.filter(o => o.status === filterStatus) : todos;
  if (q) {
    const qLower = q.toLowerCase();
    lista = lista.filter(o =>
      o.codigo.toLowerCase().includes(qLower) ||
      (o.pacientes?.nome ?? '').toLowerCase().includes(qLower)
    );
  }

  const PILLS = [
    { key: 'todos', label: 'Todos', count: todos.length },
    ...TODOS_STATUS.map(s => ({ key: s, label: STATUS_CONFIG[s].label, count: countPorStatus[s] })),
  ];

  const activeFilter = filterStatus ?? 'todos';

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 30, fontWeight: 600, color: '#1C1C1C', lineHeight: 1.15, marginBottom: 4 }}>
            Orçamentos
          </h1>
          <p style={{ fontSize: 13, color: '#9B9BA0', fontFamily: 'var(--font-montserrat)' }}>
            {todos.length} orçamentos · pipeline {formatBRL(totalEmitido)}
          </p>
        </div>
        <Link href="/orcamentos/novo" className="btn-primary">
          + Novo Orçamento
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Total Emitido"     value={formatBRL(totalEmitido)}  sub="Todos os períodos" color="blue" />
        <KpiCard title="Aprovados"         value={formatBRL(totalAprovado)} sub={`${todos.filter(o => o.status === 'aprovado').length} orçamentos`} color="green" trend={`${taxaAprovacao}% taxa`} trendUp={taxaAprovacao >= 50} />
        <KpiCard title="Em Aberto"         value={formatBRL(totalAberto)}   sub="Enviados + Negociação" color="amber" />
        <KpiCard title="Taxa de Aprovação" value={`${taxaAprovacao}%`}      sub={`${todos.filter(o => o.status === 'aprovado').length} de ${todos.length}`} color={taxaAprovacao >= 50 ? 'green' : 'amber'} />
      </div>

      {/* Toolbar: pills + busca */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        {/* Pills de status */}
        <div className="flex items-center gap-2 flex-wrap">
          {PILLS.map(p => {
            const isActive = p.key === activeFilter;
            return (
              <Link
                key={p.key}
                href={p.key === 'todos' ? '/orcamentos' : `/orcamentos?status=${p.key}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 14px',
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'var(--font-montserrat)',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  background: isActive ? '#1C1C1C' : 'rgba(0,0,0,0.04)',
                  color: isActive ? '#FFFFFF' : '#6B6B66',
                  border: isActive ? '1px solid #1C1C1C' : '1px solid rgba(0,0,0,0.08)',
                }}
              >
                {p.label}
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
                  borderRadius: 9999,
                  padding: '0 5px',
                }}>
                  {p.count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Busca */}
        <form style={{ position: 'relative' }}>
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por código ou paciente..."
            className="input-field"
            style={{ width: 260, paddingLeft: 32, fontSize: 12 }}
          />
          <svg
            width="14" height="14" viewBox="0 0 15 15" fill="none"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9B9BA0' }}
          >
            <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </form>
      </div>

      {/* Tabela */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr>
                {['Número', 'Paciente', 'Profissional', 'Emitido', 'Validade', 'Status', 'Total', ''].map((h, i) => (
                  <th
                    key={h + i}
                    className="table-header"
                    style={{
                      padding: '10px 16px',
                      textAlign: h === 'Total' ? 'right' : 'left',
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                      fontWeight: 700,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '32px 16px', textAlign: 'center', color: '#9B9BA0', fontSize: 13 }}>
                    Nenhum orçamento encontrado.
                  </td>
                </tr>
              )}
              {lista.map((orc, i) => (
                <tr
                  key={orc.id}
                  className="table-row-hover"
                  style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none', cursor: 'pointer' }}
                >
                  {/* Número */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-montserrat)', fontWeight: 600, color: '#1F7A4D', fontVariantNumeric: 'tabular-nums' }}>
                      {orc.codigo}
                    </span>
                  </td>

                  {/* Paciente */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={orc.pacientes?.nome ?? '?'} />
                      <span style={{ fontSize: 13, color: '#1C1C1C', fontFamily: 'var(--font-montserrat)', fontWeight: 500 }}>
                        {orc.pacientes?.nome ?? '—'}
                      </span>
                    </div>
                  </td>

                  {/* Profissional */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 12, color: '#9B9BA0', fontFamily: 'var(--font-montserrat)' }}>—</span>
                  </td>

                  {/* Emitido */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 12, color: '#9B9BA0', fontFamily: 'var(--font-montserrat)', fontVariantNumeric: 'tabular-nums' }}>
                      {new Date(orc.criado_em).toLocaleDateString('pt-BR')}
                    </span>
                  </td>

                  {/* Validade */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 12, color: '#9B9BA0', fontFamily: 'var(--font-montserrat)', fontVariantNumeric: 'tabular-nums' }}>
                      {orc.validade ? new Date(orc.validade).toLocaleDateString('pt-BR') : '—'}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    <StatusChip status={orc.status} type="orcamento" />
                  </td>

                  {/* Total */}
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <span style={{ fontSize: 13, fontFamily: 'var(--font-montserrat)', fontWeight: 600, color: '#1C1C1C', fontVariantNumeric: 'tabular-nums' }}>
                      {formatBRL(orc.valor_total)}
                    </span>
                  </td>

                  {/* Chevron */}
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <Link href={`/orcamentos/${orc.id}`} style={{ color: '#9B9BA0', fontSize: 16, textDecoration: 'none', display: 'block', padding: '0 4px' }}>
                      ›
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rodapé paginação simples */}
        {lista.length > 0 && (
          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid rgba(0,0,0,0.06)',
            background: '#FAF8F4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 11, color: '#9B9BA0', fontFamily: 'var(--font-montserrat)' }}>
              {lista.length} resultado{lista.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
