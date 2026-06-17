'use client';

import type { DescontoTipo } from '@/types/orcamentos';

interface Props {
  subtotal: number;
  descontoAbs: number;
  total: number;
  descontoTipo: DescontoTipo | null;
  descontoValor: number;
  descontoMotivo: string;
  travado: boolean;
  onDescontoTipo: (v: DescontoTipo | null) => void;
  onDescontoValor: (v: number) => void;
  onDescontoMotivo: (v: string) => void;
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ResumoFinanceiro({ subtotal, descontoAbs, total, descontoTipo, descontoValor, descontoMotivo, travado, onDescontoTipo, onDescontoValor, onDescontoMotivo }: Props) {
  const LIMITE_MOTIVO_OBRIGATORIO = 10; // %

  const motivoObrigatorio = descontoTipo === 'percentual' && descontoValor > LIMITE_MOTIVO_OBRIGATORIO;

  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12, padding: '18px 20px',
  };

  const inputStyle: React.CSSProperties = {
    background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '7px 10px', color: '#1C1C1C',
    fontSize: 13, fontFamily: 'var(--font-montserrat)', outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
    textTransform: 'uppercase', color: '#6B6B66',
    fontFamily: 'var(--font-montserrat)', marginBottom: 4, display: 'block',
  };

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1F7A4D', fontFamily: 'var(--font-montserrat)', marginBottom: 16 }}>
        Resumo Financeiro
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Desconto */}
        {!travado && (
          <div className="space-y-3">
            <label style={labelStyle}>Desconto global</label>
            <div className="flex gap-2">
              <select
                style={{ ...inputStyle, width: 120 }}
                value={descontoTipo ?? ''}
                onChange={e => onDescontoTipo(e.target.value ? e.target.value as DescontoTipo : null)}
                aria-label="Tipo de desconto"
              >
                <option value="">Sem desconto</option>
                <option value="percentual">Percentual (%)</option>
                <option value="valor">Valor fixo (R$)</option>
              </select>
              {descontoTipo && (
                <input
                  type="number" min="0" step="0.01"
                  style={{ ...inputStyle, flex: 1 }}
                  value={descontoValor}
                  onChange={e => onDescontoValor(Number(e.target.value))}
                  placeholder={descontoTipo === 'percentual' ? '0 %' : 'R$ 0,00'}
                  aria-label="Valor do desconto"
                />
              )}
            </div>
            {descontoTipo && (
              <div>
                <label style={{ ...labelStyle, color: motivoObrigatorio ? '#F87171' : '#6B6B66' }}>
                  Motivo {motivoObrigatorio && '(obrigatório acima de 10%)'}
                </label>
                <input
                  style={{ ...inputStyle, width: '100%', borderColor: motivoObrigatorio && !descontoMotivo ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.08)' }}
                  placeholder="Ex.: Paciente recorrente, campanha…"
                  value={descontoMotivo}
                  onChange={e => onDescontoMotivo(e.target.value)}
                  aria-label="Motivo do desconto"
                />
              </div>
            )}
          </div>
        )}

        {/* Totais */}
        <div style={{ marginLeft: !travado ? 'auto' : undefined, minWidth: 220 }}>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span style={{ fontSize: 12, color: '#6B6B66', fontFamily: 'var(--font-montserrat)' }}>Subtotal</span>
              <span style={{ fontSize: 14, color: '#1C1C1C', fontFamily: 'var(--font-montserrat)', fontWeight: 500 }}>{formatBRL(subtotal)}</span>
            </div>
            {descontoAbs > 0 && (
              <div className="flex justify-between items-center">
                <span style={{ fontSize: 12, color: '#4ADE80', fontFamily: 'var(--font-montserrat)' }}>
                  Desconto {descontoTipo === 'percentual' ? `(${descontoValor}%)` : ''}
                </span>
                <span style={{ fontSize: 14, color: '#4ADE80', fontFamily: 'var(--font-montserrat)', fontWeight: 500 }}>−{formatBRL(descontoAbs)}</span>
              </div>
            )}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />
            <div className="flex justify-between items-center">
              <span style={{ fontSize: 13, color: '#6B6B66', fontFamily: 'var(--font-montserrat)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
              <span style={{ fontSize: 22, color: '#1F7A4D', fontFamily: 'var(--font-montserrat)', fontWeight: 700 }}>{formatBRL(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
