'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { OrcamentoStatus } from '@/types/orcamentos';
import type { FormaPagamento } from '@/types/financeiro';
import { CONTA_STATUS_CONFIG, FORMA_PAGAMENTO_LABELS, formatBRL } from '@/types/financeiro';

interface ParcelaResumo {
  id: string;
  codigo: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: string;
}

interface Props {
  orcamentoId: string;
  status: OrcamentoStatus;
  valorTotal: number;
  parcelas: ParcelaResumo[];
}

export function OrcamentoFinanceiroArea({ orcamentoId, status, valorTotal, parcelas }: Props) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div className="mb-2" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: '#8A8A93', fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase' }}>
        Financeiro
      </div>

      {parcelas.length > 0 ? (
        <div className="card" style={{ padding: '14px 16px' }}>
          <div className="space-y-2 mb-3">
            {parcelas.map(p => {
              const cfg = CONTA_STATUS_CONFIG[p.status as keyof typeof CONTA_STATUS_CONFIG] ?? CONTA_STATUS_CONFIG.pendente;
              return (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-offwhite truncate" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)' }}>{p.descricao}</div>
                    <div className="text-muted" style={{ fontSize: 9 }}>
                      {new Date(p.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-offwhite" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', fontWeight: 600 }}>{formatBRL(Number(p.valor))}</div>
                    <span style={{ fontSize: 8, color: cfg.color, fontWeight: 600, letterSpacing: '0.05em' }}>{cfg.label.toUpperCase()}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <Link href="/financeiro/receber" className="text-gold text-xs block" style={{ fontFamily: 'var(--font-montserrat)' }}>
            Ver em Contas a Receber →
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: '14px 16px', borderStyle: 'dashed', borderColor: 'rgba(184,154,90,0.15)' }}>
          {status === 'aprovado' ? (
            <>
              <p className="text-muted text-xs mb-3">Gere as parcelas de cobrança deste orçamento.</p>
              <button onClick={() => setShowModal(true)} className="btn-primary text-xs w-full" style={{ padding: '8px 0' }}>
                Gerar Parcelas
              </button>
            </>
          ) : (
            <p className="text-muted text-xs">Parcelas disponíveis após aprovação.</p>
          )}
        </div>
      )}

      {showModal && (
        <GerarParcelasModal
          orcamentoId={orcamentoId}
          valorTotal={valorTotal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function GerarParcelasModal({ orcamentoId, valorTotal, onClose }: { orcamentoId: string; valorTotal: number; onClose: () => void }) {
  const router = useRouter();
  const [parcelas, setParcelas] = useState(1);
  const [entrada, setEntrada] = useState('');
  const [primeiroVencimento, setPrimeiroVencimento] = useState(new Date().toISOString().slice(0, 10));
  const [forma, setForma] = useState<FormaPagamento>('pix');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const entradaNum = parseFloat(entrada) || 0;
  const restante = valorTotal - entradaNum;
  const valorParcela = parcelas > 0 ? restante / parcelas : 0;

  const gerar = async () => {
    setLoading(true);
    setErro('');
    try {
      const res = await fetch(`/api/orcamentos/${orcamentoId}/gerar-parcelas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcelas,
          primeiro_vencimento: primeiroVencimento,
          forma_pagamento: forma,
          entrada: entradaNum > 0 ? entradaNum : undefined,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setErro(data.error ?? 'Erro ao gerar parcelas'); return; }
      router.refresh();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card" style={{ width: 440, maxWidth: '95vw', padding: 28 }}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 24, color: '#F5F2EA', fontWeight: 500 }}>Gerar Parcelas</h2>
          <button onClick={onClose} style={{ color: '#8A8A93', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <p className="text-muted text-xs mb-4">Total do orçamento: <span className="text-gold font-semibold">{formatBRL(valorTotal)}</span></p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-muted block mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entrada (R$)</label>
              <input type="number" step="0.01" min="0" max={valorTotal} className="input-field w-full" value={entrada} onChange={e => setEntrada(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <label className="text-muted block mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nº de Parcelas</label>
              <select className="input-field w-full" value={parcelas} onChange={e => setParcelas(Number(e.target.value))}>
                {Array.from({ length: 24 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}x de {formatBRL(restante / n)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-muted block mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {entradaNum > 0 ? 'Venc. da Entrada' : '1º Vencimento'}
              </label>
              <input type="date" className="input-field w-full" value={primeiroVencimento} onChange={e => setPrimeiroVencimento(e.target.value)} />
            </div>
            <div>
              <label className="text-muted block mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Forma</label>
              <select className="input-field w-full" value={forma} onChange={e => setForma(e.target.value as FormaPagamento)}>
                {(Object.keys(FORMA_PAGAMENTO_LABELS) as FormaPagamento[]).map(k => (
                  <option key={k} value={k}>{FORMA_PAGAMENTO_LABELS[k]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg px-4 py-3" style={{ background: 'rgba(184,154,90,0.05)', border: '1px solid rgba(184,154,90,0.15)' }}>
            <p style={{ fontSize: 12, color: '#D9C9A3', fontFamily: 'var(--font-montserrat)' }}>
              {entradaNum > 0 && <>Entrada de <strong>{formatBRL(entradaNum)}</strong> + </>}
              <strong>{parcelas}x</strong> de <strong>{formatBRL(valorParcela)}</strong>
            </p>
          </div>

          {erro && <p style={{ fontSize: 12, color: '#F87171', fontFamily: 'var(--font-montserrat)' }}>{erro}</p>}

          <div className="flex gap-3 justify-end pt-1">
            <button onClick={onClose} className="btn-ghost text-xs" style={{ padding: '8px 16px' }}>Cancelar</button>
            <button onClick={gerar} disabled={loading} className="btn-primary text-xs" style={{ padding: '8px 20px' }}>
              {loading ? 'Gerando...' : 'Gerar Parcelas'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
