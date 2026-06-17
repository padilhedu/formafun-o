'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProcedimentoTabela, OrcamentoItem, ProcedimentoCategoria } from '@/types/orcamentos';
import { CATEGORIA_LABELS } from '@/types/orcamentos';

interface ItemRascunho extends Omit<OrcamentoItem, 'id' | 'orcamento_id' | 'created_at'> {
  _key: string;
}

interface Props {
  orcamentoId: string;
  itensIniciais: OrcamentoItem[];
  descontoTipo: 'percentual' | 'valor' | null;
  descontoValor: number;
  observacoes: string;
  travado: boolean;
  onSaved?: () => void;
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function OrcamentoBuilder({
  orcamentoId, itensIniciais, descontoTipo: dTipoInit, descontoValor: dValInit,
  observacoes: obsInit, travado, onSaved,
}: Props) {
  const [itens, setItens] = useState<ItemRascunho[]>(
    itensIniciais.map(i => ({ ...i, _key: i.id }))
  );
  const [procedimentos, setProcedimentos] = useState<ProcedimentoTabela[]>([]);
  const [busca, setBusca] = useState('');
  const [showCatalog, setShowCatalog] = useState(false);
  const [descontoTipo, setDescontoTipo] = useState<'percentual' | 'valor' | null>(dTipoInit);
  const [descontoValor, setDescontoValor] = useState(dValInit);
  const [observacoes, setObservacoes] = useState(obsInit);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    fetch('/api/procedimentos')
      .then(r => r.json())
      .then(setProcedimentos)
      .catch(() => {});
  }, []);

  const filteredProcs = procedimentos.filter(p =>
    !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (p.codigo ?? '').toLowerCase().includes(busca.toLowerCase())
  );

  const subtotal = itens.reduce((s, i) => s + i.total, 0);
  const desconto = descontoTipo === 'percentual'
    ? subtotal * (descontoValor / 100)
    : (descontoTipo === 'valor' ? descontoValor : 0);
  const total = Math.max(0, subtotal - desconto);

  const addFromCatalog = useCallback((proc: ProcedimentoTabela) => {
    setItens(prev => [...prev, {
      _key: `new-${Date.now()}-${Math.random()}`,
      procedimento_id: proc.id,
      dente: null,
      face: null,
      descricao: proc.nome,
      valor_unitario: proc.valor_base,
      qtde: 1,
      desconto_item: 0,
      total: proc.valor_base,
      categoria: proc.categoria,
      selecionado: true,
      fixado: false,
    }]);
  }, []);

  const addManual = () => {
    setItens(prev => [...prev, {
      _key: `new-${Date.now()}`,
      procedimento_id: null,
      dente: null,
      face: null,
      descricao: '',
      valor_unitario: 0,
      qtde: 1,
      desconto_item: 0,
      total: 0,
      categoria: null,
      selecionado: true,
      fixado: false,
    }]);
  };

  const updateItem = (key: string, field: keyof ItemRascunho, value: unknown) => {
    setItens(prev => prev.map(item => {
      if (item._key !== key) return item;
      const updated = { ...item, [field]: value };
      updated.total = Math.max(0, (updated.valor_unitario * updated.qtde) - updated.desconto_item);
      return updated;
    }));
  };

  const removeItem = (key: string) => setItens(prev => prev.filter(i => i._key !== key));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/orcamentos/${orcamentoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor_subtotal: subtotal,
          valor_total: total,
          desconto_tipo: descontoTipo,
          desconto_valor: descontoValor,
          observacoes,
          itens: itens.map(({ _key: _k, ...rest }) => rest),
        }),
      });
      if (res.ok) {
        setSavedMsg('Salvo');
        setTimeout(() => setSavedMsg(''), 2500);
        onSaved?.();
      }
    } finally {
      setSaving(false);
    }
  };

  // Group items by category
  const grouped = itens.reduce<Record<string, ItemRascunho[]>>((acc, item) => {
    const cat = item.categoria ?? 'outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const th: React.CSSProperties = {
    padding: '8px 12px',
    textAlign: 'left',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.06em',
    color: '#6B6B66',
    fontFamily: 'var(--font-montserrat)',
    borderBottom: '1px solid rgba(0,0,0,0.07)',
    textTransform: 'uppercase',
  };

  return (
    <div className="space-y-4">
      {/* Action bar */}
      {!travado && (
        <div className="flex items-center gap-3 justify-between">
          <div className="flex gap-2">
            <button
              className="btn-primary text-xs"
              style={{ padding: '7px 14px' }}
              onClick={() => setShowCatalog(!showCatalog)}
            >
              + Adicionar da Tabela
            </button>
            <button
              className="btn-ghost text-xs"
              style={{ padding: '7px 14px' }}
              onClick={addManual}
            >
              + Item Manual
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-xs"
            style={{ padding: '7px 18px', minWidth: 120 }}
          >
            {saving ? 'Salvando...' : savedMsg ? '✓ ' + savedMsg : 'SALVAR'}
          </button>
        </div>
      )}

      {/* Catalog search dropdown */}
      {showCatalog && !travado && (
        <div className="card-elevated" style={{ padding: 16, border: '1px solid rgba(31,122,77,0.2)' }}>
          <input
            className="input-field w-full mb-3"
            placeholder="Buscar procedimento por nome ou código..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            autoFocus
          />
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {filteredProcs.slice(0, 30).map(p => (
              <div
                key={p.id}
                className="table-row-hover flex items-center justify-between px-3 py-2 rounded cursor-pointer"
                onClick={() => { addFromCatalog(p); setShowCatalog(false); setBusca(''); }}
              >
                <div>
                  <span className="text-offwhite text-sm" style={{ fontFamily: 'var(--font-montserrat)' }}>{p.nome}</span>
                  <span className="text-muted ml-2 text-xs">{p.codigo}</span>
                </div>
                <div className="text-right">
                  <span className="text-gold text-sm font-medium" style={{ fontFamily: 'var(--font-montserrat)' }}>
                    {formatBRL(p.valor_base)}
                  </span>
                  <span className="text-muted block text-xs">{CATEGORIA_LABELS[p.categoria]}</span>
                </div>
              </div>
            ))}
            {filteredProcs.length === 0 && (
              <p className="text-muted text-sm text-center py-4">Nenhum procedimento encontrado</p>
            )}
          </div>
        </div>
      )}

      {/* Items grouped by category */}
      {itens.length === 0 ? (
        <div className="card text-center py-12" style={{ borderStyle: 'dashed', borderColor: 'rgba(31,122,77,0.15)' }}>
          <p className="text-muted text-sm">Nenhum item adicionado ainda.</p>
          <p className="text-muted text-xs mt-1">Use os botões acima para adicionar procedimentos.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, catItens]) => (
          <div key={cat} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,0.07)', background: 'rgba(31,122,77,0.04)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: '#1F7A4D', fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase' }}>
                {CATEGORIA_LABELS[cat as ProcedimentoCategoria] ?? cat}
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: '40%' }}>Procedimento</th>
                  <th style={{ ...th, width: '10%' }}>Dente</th>
                  <th style={{ ...th, width: '15%', textAlign: 'right' }}>Valor Unit.</th>
                  <th style={{ ...th, width: '8%', textAlign: 'center' }}>Qtde</th>
                  <th style={{ ...th, width: '12%', textAlign: 'right' }}>Desconto</th>
                  <th style={{ ...th, width: '12%', textAlign: 'right' }}>Total</th>
                  {!travado && <th style={{ ...th, width: '5%' }}></th>}
                </tr>
              </thead>
              <tbody>
                {catItens.map(item => (
                  <tr key={item._key} className="table-row-hover" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <td style={{ padding: '8px 12px' }}>
                      {travado ? (
                        <span className="text-offwhite text-sm">{item.descricao}</span>
                      ) : (
                        <input
                          className="input-field w-full"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                          value={item.descricao}
                          onChange={e => updateItem(item._key, 'descricao', e.target.value)}
                        />
                      )}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      {travado ? (
                        <span className="text-muted text-xs">{item.dente ?? '—'}</span>
                      ) : (
                        <input
                          className="input-field"
                          style={{ padding: '4px 6px', fontSize: 12, width: 52, textAlign: 'center' }}
                          value={item.dente ?? ''}
                          placeholder="—"
                          onChange={e => updateItem(item._key, 'dente', e.target.value || null)}
                        />
                      )}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      {travado ? (
                        <span className="text-offwhite text-sm">{formatBRL(item.valor_unitario)}</span>
                      ) : (
                        <input
                          className="input-field"
                          style={{ padding: '4px 8px', fontSize: 12, width: 90, textAlign: 'right' }}
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.valor_unitario}
                          onChange={e => updateItem(item._key, 'valor_unitario', parseFloat(e.target.value) || 0)}
                        />
                      )}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      {travado ? (
                        <span className="text-offwhite text-sm">{item.qtde}</span>
                      ) : (
                        <input
                          className="input-field"
                          style={{ padding: '4px 6px', fontSize: 12, width: 48, textAlign: 'center' }}
                          type="number"
                          min="1"
                          value={item.qtde}
                          onChange={e => updateItem(item._key, 'qtde', parseInt(e.target.value) || 1)}
                        />
                      )}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      {travado ? (
                        <span className="text-success text-sm">{item.desconto_item > 0 ? `- ${formatBRL(item.desconto_item)}` : '—'}</span>
                      ) : (
                        <input
                          className="input-field"
                          style={{ padding: '4px 8px', fontSize: 12, width: 80, textAlign: 'right' }}
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.desconto_item}
                          onChange={e => updateItem(item._key, 'desconto_item', parseFloat(e.target.value) || 0)}
                        />
                      )}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <span className="text-offwhite font-medium text-sm" style={{ fontFamily: 'var(--font-montserrat)' }}>
                        {formatBRL(item.total)}
                      </span>
                    </td>
                    {!travado && (
                      <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                        <button
                          onClick={() => removeItem(item._key)}
                          style={{ color: '#C0392B', fontSize: 16, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          ×
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      {/* Totals panel */}
      <div className="card-elevated" style={{ padding: 20, maxWidth: 400, marginLeft: 'auto' }}>
        <div className="flex justify-between mb-2">
          <span className="text-muted text-sm">Subtotal</span>
          <span className="text-offwhite text-sm">{formatBRL(subtotal)}</span>
        </div>

        {!travado && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-muted text-sm flex-shrink-0">Desconto</span>
            <select
              className="input-field text-xs"
              style={{ padding: '3px 6px', flex: 1 }}
              value={descontoTipo ?? ''}
              onChange={e => setDescontoTipo((e.target.value as typeof descontoTipo) || null)}
            >
              <option value="">Nenhum</option>
              <option value="percentual">%</option>
              <option value="valor">R$</option>
            </select>
            {descontoTipo && (
              <input
                className="input-field text-xs"
                style={{ padding: '3px 6px', width: 70, textAlign: 'right' }}
                type="number"
                min="0"
                step={descontoTipo === 'percentual' ? '1' : '0.01'}
                value={descontoValor}
                onChange={e => setDescontoValor(parseFloat(e.target.value) || 0)}
              />
            )}
          </div>
        )}

        {desconto > 0 && (
          <div className="flex justify-between mb-2">
            <span className="text-muted text-sm">
              Desconto {descontoTipo === 'percentual' ? `(${descontoValor}%)` : ''}
            </span>
            <span style={{ color: '#1F7A4D', fontSize: 14 }}>- {formatBRL(desconto)}</span>
          </div>
        )}

        <div className="flex justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-offwhite font-semibold" style={{ fontFamily: 'var(--font-montserrat)' }}>TOTAL</span>
          <span className="text-gold font-bold text-lg" style={{ fontFamily: 'var(--font-montserrat)' }}>
            {formatBRL(total)}
          </span>
        </div>
      </div>

      {/* Observations */}
      {!travado ? (
        <div>
          <p className="text-muted mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Observações / Condições de Pagamento
          </p>
          <textarea
            className="input-field w-full"
            rows={3}
            style={{ fontSize: 13, resize: 'vertical' }}
            placeholder="Formas de pagamento aceitas, parcelamento, informações adicionais..."
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
          />
        </div>
      ) : observacoes ? (
        <div className="card" style={{ padding: 16 }}>
          <p className="text-muted mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observações</p>
          <p className="text-offwhite text-sm whitespace-pre-wrap">{observacoes}</p>
        </div>
      ) : null}
    </div>
  );
}
