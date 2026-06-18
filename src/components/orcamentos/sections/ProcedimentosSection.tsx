'use client';
import { formatBRL } from '@/lib/fmt';

import { useState, useEffect, useCallback } from 'react';
import type { ProcedimentoCategoria, ProcedimentoTabela } from '@/types/orcamentos';
import { CATEGORIA_LABELS } from '@/types/orcamentos';
import type { ItemRascunho } from '../OrcamentoBuilderV2';

interface Props {
  itens: ItemRascunho[];
  travado: boolean;
  onUpdate: (key: string, patch: Partial<ItemRascunho>) => void;
  onAdd: (item: Omit<ItemRascunho, '_key'>) => void;
  onRemove: (key: string) => void;
  onDuplicate: (key: string) => void;
  onToggleCategoria: (cat: ProcedimentoCategoria) => void;
}

// Apenas procedimentos reais (não serviços nem extras)
function isProcedimento(i: ItemRascunho) {
  return i.procedimento_id !== null && i.categoria !== 'servico';
}

const th: React.CSSProperties = {
  padding: '7px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
  color: '#6B6B66', textTransform: 'uppercase', textAlign: 'left',
  fontFamily: 'var(--font-montserrat)', whiteSpace: 'nowrap',
};

export function ProcedimentosSection({ itens, travado, onUpdate, onAdd, onRemove, onDuplicate, onToggleCategoria }: Props) {
  const [catalogo, setCatalogo] = useState<ProcedimentoTabela[]>([]);
  const [addingCat, setAddingCat] = useState<ProcedimentoCategoria | null | undefined>(undefined);
  const [busca, setBusca] = useState('');
  const [menuAberto, setMenuAberto] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/procedimentos').then(r => r.json()).then(setCatalogo).catch(() => {});
  }, []);

  const procItens = itens.filter(isProcedimento);
  const grouped = procItens.reduce<Record<string, ItemRascunho[]>>((acc, item) => {
    const cat = item.categoria ?? 'outros';
    (acc[cat] ??= []).push(item);
    return acc;
  }, {});

  const catalogoFiltrado = catalogo.filter(p =>
    !p.servico_fixo &&
    (!busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || (p.codigo ?? '').toLowerCase().includes(busca.toLowerCase())) &&
    (!addingCat || p.categoria === addingCat)
  );

  const adicionarDoCatalogo = useCallback((proc: ProcedimentoTabela) => {
    onAdd({
      procedimento_id: proc.id,
      dente: null, face: null,
      descricao: proc.nome,
      valor_unitario: proc.valor_base,
      qtde: 1,
      desconto_item: 0,
      total: proc.valor_base,
      categoria: proc.categoria,
      selecionado: true,
      fixado: false,
    });
    setAddingCat(undefined);
    setBusca('');
  }, [onAdd]);

  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, overflow: 'hidden',
  };
  const headerStyle: React.CSSProperties = {
    padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.07)',
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(255,255,255,0.02)',
  };
  const inputInline: React.CSSProperties = {
    background: 'transparent', border: 'none', outline: 'none',
    color: '#1C1C1C', fontSize: 13, fontFamily: 'var(--font-montserrat)',
    width: '100%', padding: 0,
  };

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1F7A4D', fontFamily: 'var(--font-montserrat)', marginBottom: 10 }}>
        Procedimentos
      </div>

      <div className="space-y-3">
        {Object.entries(grouped).map(([cat, catItens]) => {
          const allSel = catItens.every(i => i.selecionado || i.fixado);
          const someSel = catItens.some(i => i.selecionado);
          return (
            <div key={cat} style={cardStyle}>
              <div style={headerStyle}>
                {!travado && (
                  <input
                    type="checkbox"
                    checked={allSel}
                    ref={el => { if (el) el.indeterminate = !allSel && someSel; }}
                    onChange={() => onToggleCategoria(cat as ProcedimentoCategoria)}
                    style={{ accentColor: '#1F7A4D', width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }}
                    aria-label={`Selecionar todos em ${CATEGORIA_LABELS[cat as ProcedimentoCategoria] ?? cat}`}
                  />
                )}
                <span style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', color: '#6B6B66', fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase' }}>
                  {CATEGORIA_LABELS[cat as ProcedimentoCategoria] ?? cat}
                </span>
                <span style={{ fontSize: 11, color: '#6B6B66', fontFamily: 'var(--font-montserrat)' }}>
                  {catItens.filter(i => i.selecionado).length}/{catItens.length}
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    {!travado && <th style={{ ...th, width: 30 }}></th>}
                    <th style={th}>Procedimento</th>
                    <th style={{ ...th, width: 100 }}>Valor</th>
                    <th style={{ ...th, width: 60 }}>Qtde</th>
                    <th style={{ ...th, width: 110 }}>Total</th>
                    {!travado && <th style={{ ...th, width: 36 }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {catItens.map(item => (
                    <tr
                      key={item._key}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        opacity: item.selecionado ? 1 : 0.45,
                      }}
                    >
                      {!travado && (
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="checkbox"
                            checked={item.selecionado}
                            disabled={item.fixado}
                            onChange={() => onUpdate(item._key, { selecionado: !item.selecionado })}
                            style={{ accentColor: '#1F7A4D', cursor: item.fixado ? 'not-allowed' : 'pointer' }}
                            aria-label={`Selecionar ${item.descricao}`}
                          />
                        </td>
                      )}
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {item.fixado && <span title="Item fixado" style={{ fontSize: 10, color: '#1F7A4D' }}>📌</span>}
                          <div>
                            {travado ? (
                              <span style={{ fontSize: 13, color: '#1C1C1C', fontFamily: 'var(--font-montserrat)' }}>{item.descricao}</span>
                            ) : (
                              <input
                                style={inputInline}
                                value={item.descricao}
                                onChange={e => onUpdate(item._key, { descricao: e.target.value })}
                                aria-label="Descrição do procedimento"
                              />
                            )}
                            {(item.dente || item.face) && (
                              <div style={{ fontSize: 10, color: '#6B6B66', marginTop: 1 }}>
                                {item.dente && `Dente ${item.dente}`}{item.face && ` · ${item.face}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {travado ? (
                          <span style={{ fontSize: 13, color: '#1C1C1C', fontFamily: 'var(--font-montserrat)' }}>{formatBRL(item.valor_unitario)}</span>
                        ) : (
                          <input
                            type="number" step="0.01" min="0"
                            style={{ ...inputInline, width: 90 }}
                            value={item.valor_unitario}
                            onChange={e => onUpdate(item._key, { valor_unitario: Number(e.target.value) })}
                            aria-label="Valor unitário"
                          />
                        )}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {travado ? (
                          <span style={{ fontSize: 13, color: '#1C1C1C' }}>{item.qtde}</span>
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
                      <td style={{ padding: '8px 10px', fontFamily: 'var(--font-montserrat)', fontSize: 13, color: '#1F7A4D', fontWeight: 600 }}>
                        {formatBRL(item.total)}
                      </td>
                      {!travado && (
                        <td style={{ padding: '8px 6px', position: 'relative' }}>
                          <button
                            onClick={() => setMenuAberto(menuAberto === item._key ? null : item._key)}
                            style={{ background: 'none', border: 'none', color: '#6B6B66', cursor: 'pointer', fontSize: 16, padding: '0 4px', lineHeight: 1 }}
                            aria-label="Opções do item"
                          >
                            ⋮
                          </button>
                          {menuAberto === item._key && (
                            <div style={{
                              position: 'absolute', right: 0, top: '100%', zIndex: 40,
                              background: '#FAF8F4', border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 8, overflow: 'hidden', minWidth: 140,
                            }}>
                              {[
                                { label: item.fixado ? '📌 Desafixar' : '📌 Fixar', action: () => onUpdate(item._key, { fixado: !item.fixado }) },
                                { label: '⎘ Duplicar', action: () => onDuplicate(item._key) },
                                { label: '✕ Remover', action: () => onRemove(item._key) },
                              ].map(opt => (
                                <button
                                  key={opt.label}
                                  onClick={() => { opt.action(); setMenuAberto(null); }}
                                  style={{ width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#1C1C1C', fontFamily: 'var(--font-montserrat)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(31,122,77,0.08)')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {!travado && (
                <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <button
                    onClick={() => { setAddingCat(cat as ProcedimentoCategoria); setBusca(''); }}
                    style={{ fontSize: 11, color: '#1F7A4D', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-montserrat)', padding: 0 }}
                  >
                    + Adicionar procedimento
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state + add */}
        {procItens.length === 0 && (
          <div style={{ ...cardStyle, padding: 24, textAlign: 'center', borderStyle: 'dashed', borderColor: 'rgba(31,122,77,0.15)' }}>
            <p style={{ color: '#6B6B66', fontSize: 13, marginBottom: 12 }}>Nenhum procedimento adicionado</p>
          </div>
        )}

        {!travado && (
          <div className="flex gap-2">
            <button
              className="btn-ghost"
              style={{ fontSize: 11, padding: '7px 16px' }}
              onClick={() => { setAddingCat(null); setBusca(''); }}
            >
              + Adicionar procedimento
            </button>
          </div>
        )}
      </div>

      {/* Catalog modal — addingCat===undefined: fechado; null: aberto sem filtro; string: filtrado por categoria */}
      {addingCat !== undefined && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setAddingCat(undefined); }}
        >
          <div style={{ background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, width: 520, maxWidth: '95vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: 20, color: '#1C1C1C', fontWeight: 500, flex: 1 }}>
                {addingCat ? (CATEGORIA_LABELS[addingCat] ?? addingCat) : 'Todos os procedimentos'}
              </span>
              <button onClick={() => setAddingCat(undefined)} style={{ background: 'none', border: 'none', color: '#6B6B66', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <input
                autoFocus
                placeholder="Buscar por nome ou código…"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                style={{ width: '100%', background: '#FAF8F4', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#1C1C1C', fontSize: 13, fontFamily: 'var(--font-montserrat)', outline: 'none' }}
                aria-label="Buscar procedimento"
              />
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {catalogoFiltrado.slice(0, 50).map(proc => (
                <button
                  key={proc.id}
                  onClick={() => adicionarDoCatalogo(proc)}
                  style={{ width: '100%', textAlign: 'left', padding: '11px 20px', background: 'none', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(31,122,77,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div>
                    <span style={{ fontSize: 13, color: '#1C1C1C', fontFamily: 'var(--font-montserrat)' }}>{proc.nome}</span>
                    {proc.codigo && <span style={{ fontSize: 11, color: '#6B6B66', marginLeft: 8 }}>{proc.codigo}</span>}
                  </div>
                  <span style={{ fontSize: 13, color: '#1F7A4D', fontFamily: 'var(--font-montserrat)', fontWeight: 600, flexShrink: 0 }}>
                    {formatBRL(proc.valor_base)}
                  </span>
                </button>
              ))}
              {catalogoFiltrado.length === 0 && (
                <p style={{ padding: 20, color: '#6B6B66', fontSize: 13, textAlign: 'center' }}>Nenhum resultado</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
