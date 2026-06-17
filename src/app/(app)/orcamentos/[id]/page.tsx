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
      .order('created_at', { ascending: false }),
  ]);

  if (orcRes.error || !orcRes.data) notFound();

  const orc = orcRes.data as unknown as OrcamentoFull;
  const profissionais = (profRes.data ?? []) as { id: string; nome: string }[];
  const modelos = (modelosRes.data ?? []) as ModeloPagamento[];
  const parcelas = (parcelasRes.data ?? []).map(p => ({ ...p, valor: Number(p.valor) }));
  const contratos = (contratoRes.data ?? []) as { id: string; codigo: string; status: string }[];

  const itensOrdenados = [...(orc.orcamento_itens ?? [])].sort((a, b) =>
    (a.categoria ?? '').localeCompare(b.categoria ?? '')
  );
  const historicoOrdenado = [...(orc.orcamento_historico ?? [])].sort(
    (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
  );

  // Categoria predominante (excluindo 'servico')
  const categCounts: Record<string, number> = {};
  itensOrdenados.forEach(i => {
    if (i.categoria && i.categoria !== 'servico') {
      categCounts[i.categoria] = (categCounts[i.categoria] ?? 0) + 1;
    }
  });
  const categPredominante = Object.entries(categCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as string | undefined;

  // Perfil do usuário logado para preencher "atendente"
  const { data: profileData } = await supabase
    .from('profiles')
    .select('nome, role')
    .eq('id', user.id)
    .single();
  const atendenteNome = (profileData as { nome?: string } | null)?.nome ?? user.email ?? '';
  const isAdmin = (profileData as { role?: string } | null)?.role === 'admin';

  return (
    <div>
      {/* Locked banner */}
      {orc.travado && (
        <div style={{ marginBottom: 20, padding: '10px 18px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(31,122,77,0.06)', border: '1px solid rgba(31,122,77,0.25)' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1F7A4D', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: '#1F7A4D' }}>
            Orçamento aprovado e travado — alterações somente via aditivo
          </span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <Link href="/orcamentos" style={{ fontSize: 12, color: '#6B6B66', textDecoration: 'none', display: 'block', marginBottom: 8 }}>
            ← Orçamentos
          </Link>
          <p style={{ fontSize: 10, fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#6B6B66', marginBottom: 4 }}>
            COMERCIAL
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: '#1C1C1C', fontWeight: 600, lineHeight: 1.1 }}>
              {orc.codigo}
            </h1>
            <StatusChip status={orc.status} type="orcamento" size="md" />
            {categPredominante && (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                padding: '3px 10px', borderRadius: 6,
                background: 'rgba(31,122,77,0.08)', color: '#1F7A4D', border: '1px solid rgba(31,122,77,0.20)',
                fontFamily: 'var(--font-body)',
              }}>
                {CATEGORIA_LABELS[categPredominante as keyof typeof CATEGORIA_LABELS] ?? categPredominante}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
            <Link href={`/pacientes/${orc.paciente_id}`} style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#1F7A4D', textDecoration: 'none' }}>
              {orc.pacientes?.nome ?? '—'}
            </Link>
            {orc.validade && (
              <span style={{ fontSize: 12, color: '#6B6B66', fontFamily: 'var(--font-body)' }}>
                Válido até {new Date(orc.validade).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main builder — client component with full state */}
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
        contratos={contratos}
        atendenteNome={atendenteNome}
        isAdmin={isAdmin}
      />
    </div>
  );
}
