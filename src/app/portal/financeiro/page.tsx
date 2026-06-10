import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function formatBRL(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

export default async function PortalFinanceiroPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/portal/login');

  const { data: acesso } = await sb.from('portal_acessos').select('paciente_id').eq('user_id', user.id).single();
  if (!acesso) redirect('/portal');

  const { data: lancamentos } = await sb
    .from('lancamentos')
    .select('id, descricao, valor, tipo, data_vencimento, data_pagamento, status, forma_pagamento, link_fatura')
    .eq('paciente_id', acesso.paciente_id)
    .eq('tipo', 'receita')
    .order('data_vencimento', { ascending: false });

  const items = lancamentos ?? [];
  const pagos = items.filter(l => l.status === 'pago');
  const pendentes = items.filter(l => l.status === 'pendente');
  const vencidos = items.filter(l => l.status === 'vencido');
  const totalAberto = [...pendentes, ...vencidos].reduce((s, l) => s + Number(l.valor), 0);
  const totalPago = pagos.reduce((s, l) => s + Number(l.valor), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/portal" style={{ color: '#8A8A93', fontSize: 13 }}>← Início</Link>
      </div>
      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.6rem', color: '#B89A5A', fontWeight: 600, margin: 0 }}>
        Financeiro
      </h1>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card" style={{ padding: 16, borderLeft: `3px solid ${totalAberto > 0 ? '#F87171' : '#4ADE80'}` }}>
          <p style={{ fontSize: 10, color: '#8A8A93', fontFamily: 'var(--font-montserrat)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Saldo em Aberto</p>
          <p style={{ fontSize: '1.2rem', fontFamily: 'var(--font-montserrat)', fontWeight: 700, color: totalAberto > 0 ? '#F87171' : '#4ADE80', margin: 0 }}>{formatBRL(totalAberto)}</p>
        </div>
        <div className="card" style={{ padding: 16, borderLeft: '3px solid #4ADE80' }}>
          <p style={{ fontSize: 10, color: '#8A8A93', fontFamily: 'var(--font-montserrat)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Total Pago</p>
          <p style={{ fontSize: '1.2rem', fontFamily: 'var(--font-montserrat)', fontWeight: 700, color: '#4ADE80', margin: 0 }}>{formatBRL(totalPago)}</p>
        </div>
      </div>

      {/* Pending */}
      {[...pendentes, ...vencidos].length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: '#FBBF24', fontFamily: 'var(--font-montserrat)', fontWeight: 700, marginBottom: 10 }}>Em Aberto</p>
          <div className="space-y-2">
            {[...pendentes, ...vencidos].map(l => (
              <div key={l.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 13, color: '#F5F2EA', margin: 0, fontFamily: 'var(--font-montserrat)', fontWeight: 600 }}>{l.descricao}</p>
                    <p style={{ fontSize: 11, color: l.status === 'vencido' ? '#F87171' : '#8A8A93', marginTop: 2 }}>
                      Vence em {new Date(l.data_vencimento).toLocaleDateString('pt-BR')}
                      {l.status === 'vencido' && ' — Vencido'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '1rem', fontFamily: 'var(--font-montserrat)', fontWeight: 700, color: '#F5F2EA', margin: 0 }}>{formatBRL(Number(l.valor))}</p>
                    {l.link_fatura && (
                      <a href={l.link_fatura} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#B89A5A', textDecoration: 'none' }}>Pagar →</a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {pagos.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: '#4ADE80', fontFamily: 'var(--font-montserrat)', fontWeight: 700, marginBottom: 10 }}>Pagamentos Realizados</p>
          <div className="card" style={{ padding: 0 }}>
            {pagos.map((l, i) => (
              <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
                <div>
                  <p style={{ fontSize: 13, color: '#F5F2EA', margin: 0 }}>{l.descricao}</p>
                  <p style={{ fontSize: 11, color: '#8A8A93', marginTop: 2 }}>
                    {l.data_pagamento ? new Date(l.data_pagamento).toLocaleDateString('pt-BR') : '—'}
                    {l.forma_pagamento && ` · ${l.forma_pagamento}`}
                  </p>
                </div>
                <p style={{ fontSize: 13, fontFamily: 'var(--font-montserrat)', fontWeight: 600, color: '#4ADE80', margin: 0 }}>{formatBRL(Number(l.valor))}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="card p-8 text-center">
          <p style={{ color: '#8A8A93', fontSize: 13 }}>Nenhum lançamento financeiro encontrado.</p>
        </div>
      )}
    </div>
  );
}
