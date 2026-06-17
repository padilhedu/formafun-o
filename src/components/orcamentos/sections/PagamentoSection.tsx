'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ModeloPagamento, OrcamentoStatus } from '@/types/orcamentos';

interface Parcela {
  id: string; codigo: string; descricao: string; valor: number; vencimento: string; status: string;
}
interface ParcelaEditada { n: number; vencimento: string; valor: number; }

interface Props {
  modelos: ModeloPagamento[];
  modeloId: string;
  total: number;
  totalComDesconto: number;
  parcelasEditadas: ParcelaEditada[];
  clausulas: string;
  obsInterna: string;
  observacoes: string;
  parcelas: Parcela[];
  travado: boolean;
  orcamentoId: string;
  status: OrcamentoStatus;
  onModeloId: (v: string) => void;
  onParcelasEditadas: (v: ParcelaEditada[]) => void;
  onClausulas: (v: string) => void;
  onObsInterna: (v: string) => void;
  onObservacoes: (v: string) => void;
  labelStyle: React.CSSProperties;
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function addMonths(base: string, n: number): string {
  const d = new Date(base + 'T12:00:00');
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

export function PagamentoSection({ modelos, modeloId, total, totalComDesconto, parcelasEditadas, clausulas, obsInterna, observacoes, parcelas, travado, orcamentoId, status, onModeloId, onParcelasEditadas, onClausulas, onObsInterna, onObservacoes, labelStyle }: Props) {
  const router = useRouter();
  const [gerandoParcelas, setGerandoParcelas] = useState(false);
  const [primeiroVenc, setPrimeiroVenc] = useState(new Date().toISOString().slice(0, 10));

  const modelo = modelos.find(m => m.id === modeloId) ?? null;

  // Gera preview das parcelas ao mudar modelo ou total
  useEffect(() => {
    if (!modelo) { onParcelasEditadas([]); return; }
    const desconto = modelo.desconto_avista_percentual > 0 ? total * (1 - modelo.desconto_avista_percentual / 100) : total;
    const base = modelo.desconto_avista_percentual > 0 ? desconto : total;
    const entrada = modelo.entrada_percentual > 0 ? base * (modelo.entrada_percentual / 100) : 0;
    const restante = base - entrada;
    const n = modelo.parcelas;
    const juros = modelo.juros_percentual / 100;
    const valorParcela = n > 0
      ? juros > 0
        ? (restante * juros * Math.pow(1 + juros, n)) / (Math.pow(1 + juros, n) - 1)
        : restante / n
      : restante;

    const geradas: ParcelaEditada[] = [];
    if (entrada > 0) geradas.push({ n: 0, vencimento: primeiroVenc, valor: Number(entrada.toFixed(2)) });
    for (let i = 0; i < n; i++) {
      geradas.push({
        n: i + 1,
        vencimento: addMonths(primeiroVenc, entrada > 0 ? i + 1 : i),
        valor: Number(valorParcela.toFixed(2)),
      });
    }
    onParcelasEditadas(geradas);
  }, [modeloId, total, primeiroVenc]); // eslint-disable-line react-hooks/exhaustive-deps

  const gerarParcelasNoBanco = async () => {
    if (!modelo || parcelas.length > 0) return;
    setGerandoParcelas(true);
    try {
      await fetch(`/api/orcamentos/${orcamentoId}/gerar-parcelas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelo_pagamento_id: modeloId,
          parcelas_editadas: parcelasEditadas,
          primeiro_vencimento: primeiroVenc,
        }),
      });
      router.refresh();
    } finally {
      setGerandoParcelas(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '18px 20px',
  };
  const inputStyle: React.CSSProperties = {
    background: '#FAF8F4', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '7px 10px', color: '#1C1C1C',
    fontSize: 13, fontFamily: 'var(--font-montserrat)', outline: 'none', width: '100%',
  };
  const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical', minHeight: 80 };

  const th: React.CSSProperties = {
    padding: '7px 12px', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
    color: '#6B6B66', textTransform: 'uppercase', textAlign: 'left',
    fontFamily: 'var(--font-montserrat)',
  };

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1F7A4D', fontFamily: 'var(--font-montserrat)', marginBottom: 16 }}>
        Condições de Pagamento
      </div>

      <div className="space-y-5">
        {/* Modelo de pagamento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Modelo de pagamento</label>
            <select
              style={inputStyle}
              value={modeloId}
              disabled={travado}
              onChange={e => onModeloId(e.target.value)}
              aria-label="Modelo de pagamento"
            >
              <option value="">— Selecionar modelo —</option>
              {modelos.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                  {m.desconto_avista_percentual > 0 && ` (−${m.desconto_avista_percentual}%)`}
                  {m.juros_percentual > 0 && ` +${m.juros_percentual}%/mês`}
                </option>
              ))}
            </select>
          </div>
          {!travado && modelo && (
            <div>
              <label style={labelStyle}>Primeiro vencimento</label>
              <input type="date" style={inputStyle} value={primeiroVenc} onChange={e => setPrimeiroVenc(e.target.value)} aria-label="Primeiro vencimento" />
            </div>
          )}
        </div>

        {/* Total à vista destaque */}
        {modelo && modelo.desconto_avista_percentual > 0 && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#1F7A4D', fontFamily: 'var(--font-montserrat)' }}>
              À vista com {modelo.desconto_avista_percentual}% de desconto
            </span>
            <span style={{ fontSize: 20, color: '#1F7A4D', fontFamily: 'var(--font-montserrat)', fontWeight: 700 }}>{formatBRL(totalComDesconto)}</span>
          </div>
        )}

        {/* Tabela de parcelamento preview */}
        {parcelasEditadas.length > 0 && parcelas.length === 0 && (
          <div style={{ background: '#FAF8F4', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#6B6B66', fontFamily: 'var(--font-montserrat)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Parcelamento (preview — edite as datas antes de aprovar)
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <th style={th}>Nº</th>
                  <th style={th}>Vencimento</th>
                  <th style={{ ...th, textAlign: 'right' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {parcelasEditadas.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '7px 12px', fontSize: 12, color: '#6B6B66', fontFamily: 'var(--font-montserrat)' }}>
                      {p.n === 0 ? 'Entrada' : `${p.n}ª`}
                    </td>
                    <td style={{ padding: '7px 12px' }}>
                      {!travado ? (
                        <input
                          type="date"
                          value={p.vencimento}
                          onChange={e => {
                            const updated = [...parcelasEditadas];
                            updated[idx] = { ...p, vencimento: e.target.value };
                            onParcelasEditadas(updated);
                          }}
                          style={{ background: 'transparent', border: 'none', outline: 'none', color: '#1C1C1C', fontSize: 12, fontFamily: 'var(--font-montserrat)', cursor: 'pointer' }}
                          aria-label={`Vencimento da parcela ${p.n === 0 ? 'entrada' : p.n}`}
                        />
                      ) : (
                        <span style={{ fontSize: 12, color: '#1C1C1C', fontFamily: 'var(--font-montserrat)' }}>
                          {new Date(p.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'var(--font-montserrat)', fontSize: 13, color: '#1F7A4D', fontWeight: 600 }}>
                      {formatBRL(p.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {status === 'aprovado' && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                <button
                  onClick={() => void gerarParcelasNoBanco()}
                  disabled={gerandoParcelas}
                  className="btn-primary"
                  style={{ padding: '8px 20px', fontSize: 12 }}
                >
                  {gerandoParcelas ? 'Gerando…' : 'Confirmar e gerar cobranças'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Parcelas já geradas */}
        {parcelas.length > 0 && (
          <div style={{ background: '#FAF8F4', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              <span style={{ fontSize: 11, color: '#1F7A4D', fontFamily: 'var(--font-montserrat)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ✓ Cobranças geradas
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <th style={th}>Descrição</th>
                  <th style={th}>Vencimento</th>
                  <th style={{ ...th, textAlign: 'right' }}>Valor</th>
                  <th style={{ ...th, textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {parcelas.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: '#1C1C1C', fontFamily: 'var(--font-montserrat)' }}>{p.descricao}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: '#6B6B66', fontFamily: 'var(--font-montserrat)' }}>
                      {new Date(p.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 13, color: '#1F7A4D', fontFamily: 'var(--font-montserrat)', fontWeight: 600 }}>
                      {formatBRL(p.valor)}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: p.status === 'pago' ? '#1F7A4D' : p.status === 'vencido' ? '#C0392B' : '#C98A1E', fontFamily: 'var(--font-montserrat)', fontWeight: 600, textTransform: 'uppercase' }}>
                      {p.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cláusulas adicionais */}
        <div>
          <label style={labelStyle}>Cláusulas adicionais (vai para o contrato)</label>
          <textarea
            style={textareaStyle}
            value={clausulas}
            disabled={travado}
            placeholder="Condições especiais, garantias, responsabilidades…"
            onChange={e => onClausulas(e.target.value)}
            aria-label="Cláusulas adicionais do contrato"
          />
        </div>

        {/* Observação interna */}
        <div>
          <label style={{ ...labelStyle, color: '#C98A1E' }}>
            Observação interna ⚠ Não aparece no PDF nem no link público
          </label>
          <textarea
            style={{ ...textareaStyle, borderColor: 'rgba(251,191,36,0.2)' }}
            value={obsInterna}
            disabled={travado}
            placeholder="Notas internas, histórico de negociação…"
            onChange={e => onObsInterna(e.target.value)}
            aria-label="Observação interna (não vai ao paciente)"
          />
        </div>
      </div>
    </div>
  );
}
