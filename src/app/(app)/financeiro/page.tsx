import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { ContaReceber, ContaPagar } from '@/types/financeiro';
import { formatBRL, CONTA_STATUS_CONFIG } from '@/types/financeiro';
import { FluxoCaixaChart, type FluxoMes } from '@/components/financeiro/FluxoCaixaChart';

export const dynamic = 'force-dynamic';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default async function FinanceiroPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <div className="text-muted p-8">Configure o Supabase.</div>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10);
  const seisAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1).toISOString();

  const [{ data: receberData }, { data: pagarData }] = await Promise.all([
    supabase.from('contas_receber').select('*').gte('created_at', seisAtras).order('vencimento'),
    supabase.from('contas_pagar').select('*').gte('created_at', seisAtras).order('vencimento'),
  ]);

  const receber = (receberData as ContaReceber[]) ?? [];
  const pagar = (pagarData as ContaPagar[]) ?? [];

  // KPIs do mês
  const receberMes = receber.filter(c => c.vencimento >= inicioMes && c.vencimento <= fimMes && c.status !== 'cancelado');
  const pagarMes = pagar.filter(c => c.vencimento >= inicioMes && c.vencimento <= fimMes && c.status !== 'cancelado');

  const aReceberMes = receberMes.filter(c => c.status !== 'pago').reduce((s, c) => s + Number(c.valor), 0);
  const recebidoMes = receber.filter(c => c.status === 'pago' && c.pago_em && c.pago_em.slice(0, 10) >= inicioMes)
    .reduce((s, c) => s + Number(c.valor_pago ?? c.valor), 0);
  const aPagarMes = pagarMes.filter(c => c.status !== 'pago').reduce((s, c) => s + Number(c.valor), 0);

  const hojeStr = hoje.toISOString().slice(0, 10);
  const vencidas = receber.filter(c => c.status === 'pendente' && c.vencimento < hojeStr);
  const inadimplencia = vencidas.reduce((s, c) => s + Number(c.valor), 0);

  const saldoPrevisto = aReceberMes + recebidoMes - aPagarMes - pagarMes.filter(c => c.status === 'pago').reduce((s, c) => s + Number(c.valor_pago ?? c.valor), 0);

  // Fluxo de caixa 6 meses
  const fluxo: FluxoMes[] = [];
  for (let i = 5; i >= 0; i--) {
    const m = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const mIni = m.toISOString().slice(0, 10);
    const mFim = new Date(m.getFullYear(), m.getMonth() + 1, 0).toISOString().slice(0, 10);
    fluxo.push({
      mes: MESES[m.getMonth()] + '/' + String(m.getFullYear()).slice(2),
      recebido: receber
        .filter(c => c.status === 'pago' && c.pago_em && c.pago_em.slice(0, 10) >= mIni && c.pago_em.slice(0, 10) <= mFim)
        .reduce((s, c) => s + Number(c.valor_pago ?? c.valor), 0),
      pago: pagar
        .filter(c => c.status === 'pago' && c.pago_em && c.pago_em.slice(0, 10) >= mIni && c.pago_em.slice(0, 10) <= mFim)
        .reduce((s, c) => s + Number(c.valor_pago ?? c.valor), 0),
    });
  }

  // Próximos vencimentos (receber + pagar pendentes, 10 mais próximos)
  const proximos = [
    ...receber.filter(c => c.status === 'pendente').map(c => ({ tipo: 'receber' as const, id: c.id, descricao: c.descricao, valor: Number(c.valor), vencimento: c.vencimento, status: c.status })),
    ...pagar.filter(c => c.status === 'pendente').map(c => ({ tipo: 'pagar' as const, id: c.id, descricao: c.descricao, valor: Number(c.valor), vencimento: c.vencimento, status: c.status })),
  ].sort((a, b) => a.vencimento.localeCompare(b.vencimento)).slice(0, 10);

  const kpis = [
    { label: 'A Receber (mês)', valor: aReceberMes, cor: '#B89A5A', href: '/financeiro/receber' },
    { label: 'Recebido (mês)', valor: recebidoMes, cor: '#4ADE80', href: '/financeiro/receber?status=pago' },
    { label: 'A Pagar (mês)', valor: aPagarMes, cor: '#F87171', href: '/financeiro/pagar' },
    { label: 'Inadimplência', valor: inadimplencia, cor: vencidas.length > 0 ? '#F87171' : '#8A8A93', href: '/financeiro/receber?status=vencido', sub: `${vencidas.length} título(s) vencido(s)` },
    { label: 'Saldo Previsto (mês)', valor: saldoPrevisto, cor: saldoPrevisto >= 0 ? '#4ADE80' : '#F87171', href: '/financeiro' },
  ];

  return (
    <div>
      <div className="mb-8">
        <div style={{ fontSize: 10, fontFamily: 'var(--font-montserrat)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B89A5A', marginBottom: 4 }}>
          FINANCEIRO
        </div>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 32, fontWeight: 600, color: '#F5F2EA', lineHeight: 1.1, marginBottom: 4 }}>
          Financeiro
        </h1>
        <p style={{ fontSize: 13, color: '#8A8A93' }}>Visão geral — fluxo de caixa e inadimplência</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {kpis.map(k => (
          <Link key={k.label} href={k.href} className="block" style={{
            textDecoration: 'none',
            padding: '16px',
            borderRadius: 14,
            background: 'linear-gradient(145deg, #141416 0%, #111113 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderTop: `2px solid ${k.cor}40`,
            transition: 'border-color 0.15s, transform 0.15s',
          }}>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-montserrat)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A8A93', marginBottom: 8 }}>
              {k.label}
            </div>
            <div style={{ color: k.cor, fontFamily: 'var(--font-cormorant)', fontSize: 26, fontWeight: 600, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {formatBRL(k.valor)}
            </div>
            {k.sub && <div style={{ color: '#8A8A93', marginTop: 4, fontSize: 10 }}>{k.sub}</div>}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Fluxo de caixa */}
        <div style={{ borderRadius: 14, background: 'linear-gradient(145deg, #141416 0%, #111113 100%)', border: '1px solid rgba(255,255,255,0.07)', padding: 20 }}>
          <p style={{ fontSize: 10, fontFamily: 'var(--font-montserrat)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8A8A93', marginBottom: 16 }}>
            Fluxo de Caixa — Últimos 6 Meses
          </p>
          <FluxoCaixaChart data={fluxo} />
        </div>

        {/* Próximos vencimentos */}
        <div style={{ borderRadius: 14, background: 'linear-gradient(145deg, #141416 0%, #111113 100%)', border: '1px solid rgba(255,255,255,0.07)', padding: 20 }}>
          <p style={{ fontSize: 10, fontFamily: 'var(--font-montserrat)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8A8A93', marginBottom: 16 }}>
            Próximos Vencimentos
          </p>
          {proximos.length === 0 ? (
            <p className="text-muted text-sm">Nada pendente.</p>
          ) : (
            <div className="space-y-2">
              {proximos.map(p => {
                const vencido = p.vencimento < hojeStr;
                return (
                  <Link
                    key={p.tipo + p.id}
                    href={p.tipo === 'receber' ? '/financeiro/receber' : '/financeiro/pagar'}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg block transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.tipo === 'receber' ? '#B89A5A' : '#F87171' }} />
                      <div className="min-w-0">
                        <div className="text-offwhite truncate" style={{ fontSize: 12, fontFamily: 'var(--font-montserrat)' }}>{p.descricao}</div>
                        <div style={{ fontSize: 10, color: vencido ? '#F87171' : '#8A8A93' }}>
                          {new Date(p.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                          {vencido && ' — vencido'}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-montserrat)', fontWeight: 600, color: p.tipo === 'receber' ? '#4ADE80' : '#F87171', whiteSpace: 'nowrap' }}>
                      {p.tipo === 'receber' ? '+' : '−'}{formatBRL(p.valor)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Vencidos em destaque */}
      {vencidas.length > 0 && (
        <div className="mt-6 px-5 py-3 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.25)' }}>
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#F87171' }} />
          <span style={{ color: '#F87171', fontFamily: 'var(--font-montserrat)', fontSize: 13, fontWeight: 500 }}>
            {vencidas.length} cobrança(s) vencida(s) totalizando {formatBRL(inadimplencia)} —{' '}
            <Link href="/financeiro/receber?status=vencido" className="underline">ver inadimplência</Link>
          </span>
        </div>
      )}
    </div>
  );
}
