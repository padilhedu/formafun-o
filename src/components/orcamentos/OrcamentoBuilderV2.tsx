'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type {
  OrcamentoStatus, OrcamentoItem, OrcamentoHistorico,
  ModeloPagamento, DescontoTipo, ProcedimentoCategoria,
} from '@/types/orcamentos';
import { STATUS_CONFIG } from '@/types/orcamentos';
import { DadosAtendimento } from './sections/DadosAtendimento';
import { ProcedimentosSection } from './sections/ProcedimentosSection';
import { ServicosFixosSection } from './sections/ServicosFixosSection';
import { ExtrasSection } from './sections/ExtrasSection';
import { ResumoFinanceiro } from './sections/ResumoFinanceiro';
import { PagamentoSection } from './sections/PagamentoSection';
import { HistoricoModal } from './HistoricoModal';
import { OrcamentoContratoArea } from './OrcamentoContratoArea';

export interface ItemRascunho extends Omit<OrcamentoItem, 'id' | 'orcamento_id' | 'created_at'> {
  _key: string;
}

export interface OrcProps {
  id: string;
  codigo: string;
  paciente_id: string;
  paciente_nome: string;
  profissional_id: string | null;
  convenio: string;
  data_avaliacao: string;
  validade: string;
  sessoes_previstas: number | null;
  status: OrcamentoStatus;
  travado: boolean;
  desconto_tipo: DescontoTipo | null;
  desconto_valor: number;
  desconto_motivo: string;
  observacoes: string;
  observacao_interna: string;
  clausulas_adicionais: string;
  modelo_pagamento_id: string | null;
  token_publico: string;
}

interface Props {
  orc: OrcProps;
  itensIniciais: OrcamentoItem[];
  historico: OrcamentoHistorico[];
  profissionais: { id: string; nome: string }[];
  modelos: ModeloPagamento[];
  parcelas: { id: string; codigo: string; descricao: string; valor: number; vencimento: string; status: string }[];
  contratos: { id: string; codigo: string; status: string }[];
  atendenteNome: string;
  isAdmin: boolean;
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function OrcamentoBuilderV2({ orc, itensIniciais, historico, profissionais, modelos, parcelas, contratos, atendenteNome, isAdmin }: Props) {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<'orcamento' | 'contrato'>('orcamento');
  const [showHistorico, setShowHistorico] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);

  // Dados do atendimento
  const [pacienteId, setPacienteId] = useState(orc.paciente_id);
  const [pacienteNome, setPacienteNome] = useState(orc.paciente_nome);
  const [profissionalId, setProfissionalId] = useState(orc.profissional_id ?? '');
  const [convenio, setConvenio] = useState(orc.convenio);
  const [dataAvaliacao, setDataAvaliacao] = useState(orc.data_avaliacao);
  const [validade, setValidade] = useState(orc.validade);
  const [sessoesPrevistas, setSessoesPrevistas] = useState<string>(String(orc.sessoes_previstas ?? ''));

  // Itens
  const [itens, setItens] = useState<ItemRascunho[]>(
    itensIniciais.map(i => ({ ...i, _key: i.id, selecionado: i.selecionado ?? true, fixado: i.fixado ?? false }))
  );

  // Desconto
  const [descontoTipo, setDescontoTipo] = useState<DescontoTipo | null>(orc.desconto_tipo);
  const [descontoValor, setDescontoValor] = useState(orc.desconto_valor);
  const [descontoMotivo, setDescontoMotivo] = useState(orc.desconto_motivo);

  // Pagamento
  const [modeloId, setModeloId] = useState(orc.modelo_pagamento_id ?? '');
  const [parcelasEditadas, setParcelasEditadas] = useState<{ n: number; vencimento: string; valor: number }[]>([]);
  const [clausulas, setClausulas] = useState(orc.clausulas_adicionais);
  const [obsInterna, setObsInterna] = useState(orc.observacao_interna);
  const [observacoes, setObservacoes] = useState(orc.observacoes);

  // Financeiro calculado
  const subtotal = itens.filter(i => i.selecionado).reduce((s, i) => s + i.total, 0);
  const descontoAbs = descontoTipo === 'percentual'
    ? subtotal * (descontoValor / 100)
    : descontoTipo === 'valor' ? descontoValor : 0;
  const total = Math.max(0, subtotal - descontoAbs);

  const modeloSelecionado = modelos.find(m => m.id === modeloId) ?? null;
  const totalComDesconto = modeloSelecionado
    ? total * (1 - (modeloSelecionado.desconto_avista_percentual / 100))
    : total;

  // Debounce save
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerAutoSave = useCallback(() => {
    if (orc.travado) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void handleSave(false), 2000);
  }, [orc.travado]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { triggerAutoSave(); }, [itens, descontoTipo, descontoValor, convenio, profissionalId, validade, sessoesPrevistas, observacoes, obsInterna, clausulas, modeloId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (explicit = true) => {
    if (orc.travado) return;
    if (explicit) setSaving(true);
    try {
      await fetch(`/api/orcamentos/${orc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paciente_id: pacienteId || undefined,
          profissional_id: profissionalId || null,
          convenio,
          data_avaliacao: dataAvaliacao || null,
          validade: validade || null,
          sessoes_previstas: sessoesPrevistas ? Number(sessoesPrevistas) : null,
          desconto_tipo: descontoTipo,
          desconto_valor: descontoValor,
          desconto_motivo: descontoMotivo || null,
          valor_subtotal: subtotal,
          valor_total: total,
          observacoes: observacoes || null,
          observacao_interna: obsInterna || null,
          clausulas_adicionais: clausulas || null,
          modelo_pagamento_id: modeloId || null,
          itens: itens.map(({ _key: _k, ...rest }) => rest),
        }),
      });
      if (explicit) {
        setSaveMsg('Salvo');
        setTimeout(() => setSaveMsg(''), 2500);
      }
    } finally {
      if (explicit) setSaving(false);
    }
  };

  const mudarStatus = async (novoStatus: OrcamentoStatus) => {
    setStatusLoading(true);
    try {
      await handleSave(false);
      const endpoint = novoStatus === 'aprovado'
        ? `/api/orcamentos/${orc.id}/aprovar`
        : `/api/orcamentos/${orc.id}/status`;
      const body = novoStatus === 'aprovado' ? {} : { status: novoStatus };
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      router.refresh();
    } finally {
      setStatusLoading(false);
    }
  };

  const copiarLink = () => {
    const url = `${window.location.origin}/p/${orc.token_publico}`;
    void navigator.clipboard.writeText(url);
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 2000);
  };

  const enviarEmail = async () => {
    await handleSave(false);
    await fetch(`/api/orcamentos/${orc.id}/enviar`, { method: 'POST' });
    router.refresh();
  };

  const updateItem = useCallback((key: string, patch: Partial<ItemRascunho>) => {
    setItens(prev => prev.map(item => {
      if (item._key !== key) return item;
      const updated = { ...item, ...patch };
      updated.total = Math.max(0, (updated.valor_unitario * updated.qtde) - updated.desconto_item);
      return updated;
    }));
  }, []);

  const addItem = useCallback((partial: Omit<ItemRascunho, '_key'>) => {
    setItens(prev => [...prev, { ...partial, _key: `new-${Date.now()}-${Math.random()}` }]);
  }, []);

  const removeItem = useCallback((key: string) => {
    setItens(prev => {
      const item = prev.find(i => i._key === key);
      if (item?.fixado && !confirm('Este item está fixado. Remover mesmo assim?')) return prev;
      return prev.filter(i => i._key !== key);
    });
  }, []);

  const duplicateItem = useCallback((key: string) => {
    setItens(prev => {
      const item = prev.find(i => i._key === key);
      if (!item) return prev;
      return [...prev, { ...item, _key: `dup-${Date.now()}`, fixado: false }];
    });
  }, []);

  const toggleCategoria = useCallback((categoria: ProcedimentoCategoria) => {
    setItens(prev => {
      const catItens = prev.filter(i => i.categoria === categoria);
      const allSelected = catItens.every(i => i.selecionado || i.fixado);
      return prev.map(i => {
        if (i.categoria !== categoria) return i;
        if (i.fixado) return i;
        return { ...i, selecionado: !allSelected };
      });
    });
  }, []);

  const { status, travado } = orc;
  const cfg = STATUS_CONFIG[status];

  // CTA do rodapé
  const ctaLabel = status === 'rascunho' ? 'Enviar ao paciente'
    : (status === 'enviado' || status === 'negociacao') ? 'Aprovar orçamento'
    : status === 'aprovado' ? 'Contrato →'
    : null;

  const handleCta = async () => {
    if (status === 'rascunho') { await enviarEmail(); await mudarStatus('enviado'); }
    else if (status === 'enviado' || status === 'negociacao') { await mudarStatus('aprovado'); }
    else if (status === 'aprovado') { setAbaAtiva('contrato'); }
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
    textTransform: 'uppercase', color: '#8A8A93',
    fontFamily: 'var(--font-montserrat)', marginBottom: 4, display: 'block',
  };

  return (
    <div style={{ paddingBottom: 96 }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        {/* Abas */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#121214', border: '1px solid rgba(255,255,255,0.07)' }}>
          {(['orcamento', 'contrato'] as const).map(aba => (
            <button
              key={aba}
              onClick={() => setAbaAtiva(aba)}
              style={{
                padding: '6px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 12, fontFamily: 'var(--font-montserrat)', fontWeight: 600,
                background: abaAtiva === aba ? '#1A1A1E' : 'transparent',
                color: abaAtiva === aba ? '#F5F2EA' : '#8A8A93',
                transition: 'all 0.15s',
              }}
            >
              {aba === 'orcamento' ? 'Orçamento' : `Contrato${contratos.length > 0 ? ` · ${contratos.length}` : ''}`}
            </button>
          ))}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowHistorico(true)} className="btn-ghost" style={{ padding: '6px 12px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 5 }} title="Histórico">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 5h6M5 8h6M5 11h4" strokeLinecap="round"/></svg>
            Histórico
          </button>
          <button onClick={copiarLink} className="btn-ghost" style={{ padding: '6px 12px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            {linkCopiado
              ? <><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#4ADE80" strokeWidth="2"><path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg> Copiado</>
              : <><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 4H4a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1v-2" strokeLinecap="round"/><rect x="6" y="2" width="8" height="8" rx="1.5"/></svg> Link público</>
            }
          </button>
          <a href={`/orcamentos/${orc.id}/imprimir`} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ padding: '6px 12px', fontSize: 11, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 2v4h4M5 9h6M5 12h4" strokeLinecap="round"/></svg>
            PDF
          </a>
          {!travado && (
            <button
              onClick={() => void handleSave(true)}
              disabled={saving}
              className="btn-primary"
              style={{ padding: '6px 18px', fontSize: 11, minWidth: 90 }}
            >
              {saving ? 'Salvando…' : saveMsg ? `✓ ${saveMsg}` : 'Salvar'}
            </button>
          )}
        </div>
      </div>

      {abaAtiva === 'orcamento' && (
        <div className="space-y-5">
          {/* Seção 1 */}
          <DadosAtendimento
            pacienteId={pacienteId} pacienteNome={pacienteNome}
            profissionalId={profissionalId} profissionais={profissionais}
            convenio={convenio} dataAvaliacao={dataAvaliacao}
            validade={validade} sessoesPrevistas={sessoesPrevistas}
            atendenteNome={atendenteNome} isAdmin={isAdmin} travado={travado}
            onChange={{ setPacienteId, setPacienteNome, setProfissionalId, setConvenio, setDataAvaliacao, setValidade, setSessoesPrevistas }}
            labelStyle={labelStyle}
          />

          {/* Seção 2 — Procedimentos */}
          <ProcedimentosSection
            itens={itens} travado={travado}
            onUpdate={updateItem} onAdd={addItem} onRemove={removeItem}
            onDuplicate={duplicateItem} onToggleCategoria={toggleCategoria}
          />

          {/* Seção 3 — Serviços fixos */}
          <ServicosFixosSection
            itens={itens} travado={travado}
            onAdd={addItem} onRemove={removeItem}
          />

          {/* Seção 4 — Extras */}
          <ExtrasSection
            itens={itens} travado={travado}
            onUpdate={updateItem} onAdd={addItem} onRemove={removeItem}
          />

          {/* Seção 5 — Resumo sticky */}
          <ResumoFinanceiro
            subtotal={subtotal} descontoAbs={descontoAbs} total={total}
            descontoTipo={descontoTipo} descontoValor={descontoValor} descontoMotivo={descontoMotivo}
            travado={travado}
            onDescontoTipo={setDescontoTipo}
            onDescontoValor={setDescontoValor}
            onDescontoMotivo={setDescontoMotivo}
          />

          {/* Seção 6 — Pagamento */}
          <PagamentoSection
            modelos={modelos} modeloId={modeloId} total={total}
            totalComDesconto={totalComDesconto}
            parcelasEditadas={parcelasEditadas}
            clausulas={clausulas} obsInterna={obsInterna} observacoes={observacoes}
            parcelas={parcelas} travado={travado}
            orcamentoId={orc.id} status={status}
            onModeloId={setModeloId}
            onParcelasEditadas={setParcelasEditadas}
            onClausulas={setClausulas}
            onObsInterna={setObsInterna}
            onObservacoes={setObservacoes}
            labelStyle={labelStyle}
          />
        </div>
      )}

      {abaAtiva === 'contrato' && (
        <div className="mt-2">
          <OrcamentoContratoArea
            orcamentoId={orc.id}
            pacienteId={pacienteId}
            status={status}
            contratos={contratos as { id: string; codigo: string; status: import('@/types/contratos').ContratoStatus }[]}
          />
        </div>
      )}

      {/* Rodapé CTA fixo */}
      {ctaLabel && !travado && (
        <div className="fixed bottom-0 left-0 right-0 z-40" style={{ background: 'rgba(10,10,11,0.95)', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '12px 24px', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <div className="flex items-center gap-3">
            <div>
              <span style={{ fontSize: 12, color: '#8A8A93', fontFamily: 'var(--font-montserrat)' }}>Total </span>
              <span style={{ fontSize: 16, color: '#B89A5A', fontFamily: 'var(--font-montserrat)', fontWeight: 700 }}>{formatBRL(total)}</span>
            </div>
            <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, fontFamily: 'var(--font-montserrat)' }}>
              {cfg.label}
            </span>
            <button
              onClick={() => void handleCta()}
              disabled={statusLoading}
              className="btn-primary"
              style={{ padding: '9px 24px', fontSize: 13, fontWeight: 700 }}
            >
              {statusLoading ? '…' : ctaLabel}
            </button>
          </div>
        </div>
      )}

      {showHistorico && <HistoricoModal historico={historico} onClose={() => setShowHistorico(false)} />}
    </div>
  );
}
