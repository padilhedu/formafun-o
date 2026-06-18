import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PortalTratamentoPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/portal/login');

  const { data: acesso } = await sb.from('portal_acessos').select('paciente_id').eq('user_id', user.id).single();
  if (!acesso) redirect('/portal');

  // Fetch approved budgets and their items
  const { data: orcamentos } = await sb.from('orcamentos')
    .select('id, codigo, status, valor_total, criado_em, itens_orcamento(id, descricao, dente, face, quantidade, valor_unitario, status_execucao)')
    .eq('paciente_id', acesso.paciente_id)
    .in('status', ['aprovado'])
    .order('criado_em', { ascending: false });

  const ors = orcamentos ?? [];

  const STATUS_EXEC: Record<string, { label: string; color: string }> = {
    pendente:     { label: 'A realizar', color: '#6B6B66' },
    em_andamento: { label: 'Em andamento', color: '#FBBF24' },
    concluido:    { label: 'Concluído', color: '#4ADE80' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/portal" style={{ color: '#6B6B66', fontSize: 13 }}>← Início</Link>
      </div>
      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.6rem', color: '#1F7A4D', fontWeight: 600, margin: 0 }}>
        Meu Tratamento
      </h1>

      {ors.length === 0 && (
        <div className="card p-8 text-center">
          <p style={{ color: '#6B6B66', fontSize: 13 }}>Nenhum plano de tratamento ativo.</p>
        </div>
      )}

      {ors.map(orc => {
        const itens = (orc.itens_orcamento as unknown as { id: string; descricao: string; dente: string | null; face: string | null; quantidade: number; valor_unitario: number; status_execucao: string | null }[]) ?? [];
        const total = itens.length;
        const concluidos = itens.filter(i => i.status_execucao === 'concluido').length;
        const progresso = total > 0 ? Math.round((concluidos / total) * 100) : 0;

        return (
          <div key={orc.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 13, color: '#1C1C1C', fontFamily: 'var(--font-montserrat)', fontWeight: 600, margin: 0 }}>
                  Plano {orc.codigo}
                </p>
                <span style={{ fontSize: 12, color: '#4ADE80', fontFamily: 'var(--font-montserrat)', fontWeight: 600 }}>
                  {concluidos}/{total} concluídos
                </span>
              </div>
              {/* Progress bar */}
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progresso}%`, background: '#4ADE80', borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
            </div>

            {/* Items */}
            {itens.map((item, i) => {
              const exec = STATUS_EXEC[item.status_execucao ?? 'pendente'] ?? STATUS_EXEC.pendente;
              return (
                <div key={item.id} style={{ padding: '12px 20px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : undefined, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 13, color: '#1C1C1C', margin: 0 }}>{item.descricao}</p>
                    {(item.dente || item.face) && (
                      <p style={{ fontSize: 11, color: '#6B6B66', marginTop: 2 }}>
                        {item.dente && `Dente ${item.dente}`}{item.face && ` · ${item.face}`}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: exec.color, background: `${exec.color}18`, border: `1px solid ${exec.color}40`, borderRadius: 5, padding: '2px 8px', fontFamily: 'var(--font-montserrat)', fontWeight: 600, flexShrink: 0 }}>
                    {exec.label}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
