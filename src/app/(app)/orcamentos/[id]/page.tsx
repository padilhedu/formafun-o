import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import type { Orcamento, OrcamentoItem, OrcamentoHistorico, ModeloPagamento } from '@/types/orcamentos';
import { CATEGORIA_LABELS } from '@/types/orcamentos';
import { StatusChip } from '@/components/ui/StatusChip';
import { OrcamentoBuilderV2 } from '@/components/orcamentos/OrcamentoBuilderV2';

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

  const [orcRes, profRes, modelosRes, parcelasRes, contratoRes] = await Promise.all([
    supabase
      .from('orcamentos')
      .select('*, pacientes(nome, cpf, telefone, email), orcamento_itens(*), orcamento_historico(*)')
      .eq('id', id)
      .single(),
    supabase.from('profissionais').select('id, nome').eq('ativo', true).order('nome'),
    supabase.from('modelos_pagamento').select('*').eq('ativo', true).order('nome'),
    supabase
      .from('contas_receber')
      .select('id, codigo, descricao, valor, vencimento, status')
      .eq('orcamento_id', id)
      .neq('status', 'cancelado')
      .order('vencimento'),
    supabase
      .from('contratos')
      .select('id, codigo, status')
      .eq('orcamento_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (orcRes.error || !orcRes.data) notFound();

  const orc = orcRes.data as unknown as OrcamentoFull;
  const profissionais = (profRes.data ?? []) as { id: string; nome: string }[];
  const modelos = (modelosRes.data ?? []) as ModeloPagamento[];
  const parcelas = (parcelasRes.data ?? []).map(p => ({ ...p, valor: Number(p.valor) }));
  const contrato = contratoRes.data ?? null;

  const itensOrdenados = [...(orc.orcamento_itens ?? [])].sort((a, b) =>
    (a.categoria ?? '').localeCompare(b.categoria ?? '')
  );
  const historicoOrdenado = [...(orc.orcamento_historico ?? [])].sort(
    (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
  );

  const categCounts: Record<string, number> = {};
  itensOrdenados.forEach(i => {
    if (i.categoria && i.categoria !== 'servico') {
      categCounts[i.categoria] = (categCounts[i.categoria] ?? 0) + 1;
    }
  });
  const categPredominante = Object.entries(categCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as string | undefined;

  const { data: profileData } = await supabase
    .from('profiles')
    .select('nome, role')
    .eq('id', user.id)
    .single();
  const atendenteNome = (profileData as { nome?: string } | null)?.nome ?? user.email ?? '';
  const isAdmin = (profileData as { role?: string } | null)?.role === 'admin';

  return (
    <div>
      {/* Banner travado */}
      {orc.travado && (
        <div className="mb-5 px-5 py-3 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(31,122,77,0.07)', border: '1px solid rgba(31,122,77,0.25)' }}>
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#1F7A4D' }} />
          <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: 13, color: '#1F7A4D', fontWeight: 600 }}>
            Orçamento aprovado e travado — alterações somente via aditivo
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <Link href="/orcamentos" style={{ fontSize: 12, color: '#9B9BA0', textDecoration: 'none', display: 'block', marginBottom: 6 }}
            onMouseEnter={() => {}} onMouseLeave={() => {}}>
            ← Orçamentos
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="heading" style={{ fontFamily: 'var(--font-cormorant)', fontSize: 26, color: '#1C1C1C', fontWeight: 600 }}>
              {orc.codigo}
            </h1>
            <StatusChip status={orc.status} type="orcamento" />
            {categPredominante && (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                padding: '3px 10px', borderRadius: 6,
                background: 'rgba(31,122,77,0.08)', color: '#1F7A4D', border: '1px solid rgba(31,122,77,0.2)',
                fontFamily: 'var(--font-montserrat)',
              }}>
                {CATEGORIA_LABELS[categPredominante as keyof typeof CATEGORIA_LABELS] ?? categPredominante}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 flex-wrap">
            <Link href={`/pacientes/${orc.paciente_id}`} style={{ fontFamily: 'var(--font-montserrat)', fontSize: 13, color: '#1F7A4D', textDecoration: 'none', fontWeight: 500 }}>
              {orc.pacientes?.nome ?? '—'}
            </Link>
            {orc.validade && (
              <span style={{ fontSize: 12, color: '#9B9BA0', fontFamily: 'var(--font-montserrat)' }}>
                Válido até {new Date(orc.validade).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>

        {/* Ações do header */}
        <div className="flex items-center gap-2">
          <button className="btn-ghost" style={{ fontSize: 12 }}>Editar</button>
          <button className="btn-ghost" style={{ fontSize: 12 }}>PDF</button>
          <button className="btn-primary" style={{ fontSize: 12 }}>Enviar ao paciente</button>
        </div>
      </div>

      {/* Builder (sem mudanças de lógica) */}
      <OrcamentoBuilderV2
        orc={{
          id: orc.id,
          codigo: orc.codigo,
          paciente_id: orc.paciente_id,
          paciente_nome: orc.pacientes?.nome ?? '',
          profissional_id: orc.profissional_id,
          convenio: orc.convenio ?? 'Particular',
          data_avaliacao: orc.data_avaliacao ?? new Date().toISOString().slice(0, 10),
          validade: orc.validade ?? '',
          sessoes_previstas: orc.sessoes_previstas ?? null,
          status: orc.status,
          travado: orc.travado,
          desconto_tipo: orc.desconto_tipo,
          desconto_valor: orc.desconto_valor,
          desconto_motivo: orc.desconto_motivo ?? '',
          observacoes: orc.observacoes ?? '',
          observacao_interna: orc.observacao_interna ?? '',
          clausulas_adicionais: orc.clausulas_adicionais ?? '',
          modelo_pagamento_id: orc.modelo_pagamento_id,
          token_publico: orc.token_publico,
        }}
        itensIniciais={itensOrdenados}
        historico={historicoOrdenado}
        profissionais={profissionais}
        modelos={modelos}
        parcelas={parcelas}
        contrato={contrato}
        atendenteNome={atendenteNome}
        isAdmin={isAdmin}
      />
    </div>
  );
}
