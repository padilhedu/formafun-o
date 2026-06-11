'use client';

import type { ItemRascunho } from '../OrcamentoBuilderV2';

interface Props {
  itens: ItemRascunho[];
  travado: boolean;
  onUpdate: (key: string, patch: Partial<ItemRascunho>) => void;
  onAdd: (item: Omit<ItemRascunho, '_key'>) => void;
  onRemove: (key: string) => void;
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function isExtra(i: ItemRascunho) {
  return i.procedimento_id === null && i.categoria !== 'servico';
}

const th: React.CSSProperties = {
  padding: '7px 12px', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
  color: '#8A8A93', textTransform: 'uppercase', textAlign: 'left',
  fontFamily: 'var(--font-montserrat)',
};

const inputInline: React.CSSProperties = {
  background: 'transparent', border: 'none', outline: 'none',
  color: '#F5F2EA', fontSize: 13, fontFamily: 'var(--font-montserrat)',
  width: '100%', padding: 0,
};

export function ExtrasSection({ itens, travado, onUpdate, onAdd, onRemove }: Props) {
  const extras = itens.filter(isExtra);

  const adicionarExtra = () => {
    onAdd({
      procedimento_id: null,
      dente: null, face: null,
      descricao: '',
      valor_unitario: 0,
      qtde: 1,
      desconto_item: 0,
      total: 0,
      categoria: null,
      selecionado: true,
      fixado: false,
    });
  };

  const cardStyle: React.CSSProperties = {
    background: '#121214', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden',
  };

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#B89A5A', fontFamily: 'var(--font-montserrat)', marginBottom: 10 }}>
        Itens Extras / Materiais
      </div>

      <div style={cardStyle}>
        {extras.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <th style={th}>Item</th>
                <th style={{ ...th, width: 110 }}>Valor</th>
                <th style={{ ...th, width: 60 }}>Qtde</th>
                <th style={{ ...th, width: 110 }}>Total</th>
                {!travado && <th style={{ ...th, width: 36 }}></th>}
              </tr>
            </thead>
            <tbody>
              {extras.map(item => (
                <tr key={item._key} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '8px 12px' }}>
                    {travado ? (
                      <span style={{ fontSize: 13, color: '#F5F2EA', fontFamily: 'var(--font-montserrat)' }}>{item.descricao || '—'}</span>
                    ) : (
                      <input
                        style={inputInline}
                        placeholder="Descrição do item…"
                        value={item.descricao}
                        onChange={e => onUpdate(item._key, { descricao: e.target.value })}
                        aria-label="Descrição do item extra"
                      />
                    )}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    {travado ? (
                      <span style={{ fontSize: 13, color: '#F5F2EA' }}>{formatBRL(item.valor_unitario)}</span>
                    ) : (
                      <input
                        type="number" step="0.01" min="0"
                        style={{ ...inputInline, width: 90 }}
                        value={item.valor_unitario}
                        onChange={e => onUpdate(item._key, { valor_unitario: Number(e.target.value) })}
                        aria-label="Valor do item"
                      />
                    )}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    {travado ? (
                      <span style={{ fontSize: 13, color: '#F5F2EA' }}>{item.qtde}</span>
                    ) : (
                      <input
                        type="number" min="1" step="1"
                        style={{ ...inputInline, width: 50 }}
                        value={item.qtde}
                        onChange={e => onUpdate(item._key, { qtde: Number(e.target.value) })}
                        aria-label="Quantidade"
                      />
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-montserrat)', fontSize: 13, color: '#B89A5A', fontWeight: 600 }}>
                    {formatBRL(item.total)}
                  </td>
                  {!travado && (
                    <td style={{ padding: '8px 6px' }}>
                      <button
                        onClick={() => onRemove(item._key)}
                        style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}
                        aria-label="Remover item"
                      >
                        ×
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {extras.length === 0 && (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <p style={{ color: '#8A8A93', fontSize: 13, marginBottom: 0 }}>Nenhum item extra</p>
          </div>
        )}

        {!travado && (
          <div style={{ padding: '10px 14px', borderTop: extras.length > 0 ? '1px solid rgba(255,255,255,0.04)' : undefined }}>
            <button
              onClick={adicionarExtra}
              style={{ fontSize: 11, color: '#B89A5A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-montserrat)', padding: 0 }}
            >
              + Adicionar item extra
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
