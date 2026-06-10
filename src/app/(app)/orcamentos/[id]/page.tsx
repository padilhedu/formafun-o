import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import type { Orcamento, OrcamentoItem, OrcamentoHistorico } from '@/types/orcamentos';
import { STATUS_CONFIG } from '@/types/orcamentos';
import { StatusBadge } from '@/components/orcamentos/StatusBadge';
import { OrcamentoBuilder } from '@/components/orcamentos/OrcamentoBuilder';
import { OrcamentoAcoes } from '@/components/orcamentos/OrcamentoAcoes';
import { OrcamentoContratoArea } from '@/components/orcamentos/OrcamentoContratoArea';
import { OrcamentoFinanceiroArea } from '@/components/orcamentos/OrcamentoFinanceiroArea';

export const dynamic = 'force-dynamic';

interface OrcamentoFull extends Orcamento {
  orcamento_itens: OrcamentoItem[];
  orcamento_historico: OrcamentoHistorico[];
  pacientes: { nome: string; cpf: string | null; telefone: string | null; email: string | null } | null;
}

export default async function OrcamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <div className="text-muted p-8">Configure o Supabase.</div>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } = await supabase
    .from('orcamentos')
    .select('*, pacientes(nome, cpf, telefone, email), orcamento_itens(*), orcamento_historico(*)')
    .eq('id', id)
    .single();

  // Load any linked contract
  const { data: contratoData } = await supabase
    .from('contratos')
    .select('id, codigo, status')
    .eq('orcamento_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Load parcelas vinculadas
  const { data: parcelasData } = await supabase
    .from('contas_receber')
    .select('id, codigo, descricao, valor, vencimento, status')
    .eq('orcamento_id', id)
    .neq('status', 'cancelado')
    .order('vencimento');

  if (error || !data) notFound();

  const orc = data as unknown as OrcamentoFull;
  const cfg = STATUS_CONFIG[orc.status];

  const itensOrdenados = [...(orc.orcamento_itens ?? [])].sort((a, b) =>
    (a.categoria ?? '').localeCompare(b.categoria ?? '')
  );

  const historicoOrdenado = [...(orc.orcamento_historico ?? [])].sort(
    (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
  );

  return (
    <div>
      {/* Locked banner */}
      {orc.travado && (
        <div className="mb-6 px-5 py-3 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.25)' }}>
          <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
          <span className="text-success font-medium" style={{ fontFamily: 'var(--font-montserrat)', fontSize: 13 }}>
            Orçamento aprovado e travado — alterações somente via aditivo
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/orcamentos" className="text-muted hover:text-offwhite transition-colors" style={{ fontSize: 13 }}>
              ← Orçamentos
            </Link>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="heading text-3xl text-offwhite" style={{ fontFamily: 'var(--font-cormorant)' }}>
              {orc.codigo}
            </h1>
            <StatusBadge status={orc.status} />
            {orc.travado && (
              <span style={{ fontSize: 11, background: 'rgba(74,222,128,0.1)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 6, padding: '3px 10px', fontFamily: 'var(--font-montserrat)', fontWeight: 600 }}>
                TRAVADO
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <Link href={`/pacientes/${orc.paciente_id}`} className="text-offwhite hover:text-gold transition-colors" style={{ fontFamily: 'var(--font-montserrat)', fontSize: 14, fontWeight: 500 }}>
              {orc.pacientes?.nome ?? '—'}
            </Link>
            {orc.pacientes?.cpf && <span className="text-muted text-sm">CPF {orc.pacientes.cpf}</span>}
            {orc.validade && (
              <span className="text-muted text-sm">
                Válido até {new Date(orc.validade).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <OrcamentoAcoes
          orcamentoId={orc.id}
          status={orc.status}
          travado={orc.travado}
          codigo={orc.codigo}
        />
      </div>

      {/* Totals summary bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Subtotal', value: orc.valor_subtotal, color: '#F5F2EA' },
          { label: 'Desconto', value: orc.desconto_valor, color: '#4ADE80' },
          { label: 'Total', value: orc.valor_total, color: '#B89A5A' },
          { label: 'Itens', value: itensOrdenados.length, color: '#F5F2EA', isCount: true },
        ].map(card => (
          <div key={card.label} className="card" style={{ padding: '14px 18px' }}>
            <div className="text-muted mb-1" style={{ fontSize: 10, fontFamily: 'var(--font-montserrat)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {card.label}
            </div>
            <div style={{ color: card.color, fontFamily: 'var(--font-montserrat)', fontSize: 18, fontWeight: 700 }}>
              {card.isCount
                ? String(card.value)
                : (card.value as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>
        ))}
      </div>

      {/* Main content: builder + history */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
        {/* Builder */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: '#B89A5A', fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase' }}>
              Itens do Orçamento
            </span>
          </div>
          <OrcamentoBuilder
            orcamentoId={orc.id}
            itensIniciais={itensOrdenados}
            descontoTipo={orc.desconto_tipo}
            descontoValor={orc.desconto_valor}
            observacoes={orc.observacoes ?? ''}
            travado={orc.travado}
          />
        </div>

        {/* Sidebar: history */}
        <div>
          <div className="mb-4" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: '#8A8A93', fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase' }}>
            Histórico
          </div>
          <div className="space-y-2">
            {historicoOrdenado.length === 0 && (
              <p className="text-muted text-sm">Sem registros</p>
            )}
            {historicoOrdenado.map(h => (
              <div key={h.id} className="card" style={{ padding: '12px 14px' }}>
                <div className="text-offwhite capitalize" style={{ fontSize: 12, fontFamily: 'var(--font-montserrat)', fontWeight: 500 }}>
                  {h.evento}
                </div>
                <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
                  {new Date(h.criado_em).toLocaleString('pt-BR')}
                </div>
              </div>
            ))}
          </div>

          {/* Public link */}
          <div className="mt-6">
            <div className="mb-2" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: '#8A8A93', fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase' }}>
              Link público
            </div>
            <div className="card" style={{ padding: '12px 14px' }}>
              <p className="text-muted text-xs mb-2">Compartilhe este link com o paciente para visualização read-only:</p>
              <code style={{ fontSize: 10, color: '#D9C9A3', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                /p/{orc.token_publico}
              </code>
            </div>
          </div>

          {/* Print link */}
          <div className="mt-3">
            <Link
              href={`/orcamentos/${orc.id}/imprimir`}
              target="_blank"
              className="btn-ghost text-xs w-full text-center block"
              style={{ padding: '8px 0' }}
            >
              Imprimir / Gerar PDF
            </Link>
          </div>

          {/* Contract area */}
          <div className="mt-6">
            <OrcamentoContratoArea
              orcamentoId={orc.id}
              pacienteId={orc.paciente_id}
              status={orc.status}
              contratoExistente={contratoData ? { id: contratoData.id, codigo: contratoData.codigo, status: contratoData.status } : null}
            />
          </div>

          {/* Parcelas area */}
          <div className="mt-6">
            <OrcamentoFinanceiroArea
              orcamentoId={orc.id}
              status={orc.status}
              valorTotal={Number(orc.valor_total)}
              parcelas={(parcelasData ?? []).map(p => ({ ...p, valor: Number(p.valor) }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
