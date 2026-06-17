'use client';

import { useState, useEffect } from 'react';
import type { ProcedimentoTabela } from '@/types/orcamentos';
import type { ItemRascunho } from '../OrcamentoBuilderV2';

interface Props {
  itens: ItemRascunho[];
  travado: boolean;
  onAdd: (item: Omit<ItemRascunho, '_key'>) => void;
  onRemove: (key: string) => void;
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ServicosFixosSection({ itens, travado, onAdd, onRemove }: Props) {
  const [servicosDisponiveis, setServicosDisponiveis] = useState<ProcedimentoTabela[]>([]);

  useEffect(() => {
    fetch('/api/procedimentos?servico_fixo=true')
      .then(r => r.json())
      .then(setServicosDisponiveis)
      .catch(() => {});
  }, []);

  const servicosNoOrc = itens.filter(i => i.categoria === 'servico');
  const servicosNoOrcIds = new Set(servicosNoOrc.map(i => i.procedimento_id).filter(Boolean));

  const adicionar = (proc: ProcedimentoTabela) => {
    onAdd({
      procedimento_id: proc.id,
      dente: null, face: null,
      descricao: proc.nome,
      valor_unitario: proc.valor_base,
      qtde: 1,
      desconto_item: 0,
      total: proc.valor_base,
      categoria: 'servico',
      selecionado: true,
      fixado: false,
    });
  };

  const remover = (proc: ProcedimentoTabela) => {
    const item = servicosNoOrc.find(i => i.procedimento_id === proc.id);
    if (item) onRemove(item._key);
  };

  if (servicosDisponiveis.length === 0) return null;

  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden',
  };

  const th: React.CSSProperties = {
    padding: '7px 12px', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
    color: '#6B6B66', textTransform: 'uppercase', textAlign: 'left',
    fontFamily: 'var(--font-montserrat)',
  };

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1F7A4D', fontFamily: 'var(--font-montserrat)', marginBottom: 10 }}>
        Serviços da Clínica
      </div>

      <div style={cardStyle}>
        <div style={{ padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', color: '#6B6B66', fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase' }}>
            Serviços
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <th style={th}>Serviço</th>
              <th style={{ ...th, width: 110 }}>Valor padrão</th>
              {!travado && <th style={{ ...th, width: 80, textAlign: 'center' }}>+/−</th>}
            </tr>
          </thead>
          <tbody>
            {servicosDisponiveis.map(proc => {
              const noOrc = servicosNoOrcIds.has(proc.id);
              return (
                <tr key={proc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: noOrc ? 'rgba(31,122,77,0.04)' : 'transparent' }}>
                  <td style={{ padding: '9px 12px', fontSize: 13, color: '#1C1C1C', fontFamily: 'var(--font-montserrat)' }}>
                    {proc.nome}
                    {noOrc && <span style={{ marginLeft: 8, fontSize: 10, color: '#4ADE80', fontWeight: 700 }}>✓ incluído</span>}
                  </td>
                  <td style={{ padding: '9px 12px', fontSize: 13, color: '#6B6B66', fontFamily: 'var(--font-montserrat)' }}>
                    {formatBRL(proc.valor_base)}
                  </td>
                  {!travado && (
                    <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                      {noOrc ? (
                        <button
                          onClick={() => remover(proc)}
                          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#F87171', borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-montserrat)' }}
                          aria-label={`Remover ${proc.nome}`}
                        >
                          − Remover
                        </button>
                      ) : (
                        <button
                          onClick={() => adicionar(proc)}
                          style={{ background: 'rgba(31,122,77,0.1)', border: '1px solid rgba(31,122,77,0.25)', color: '#1F7A4D', borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-montserrat)' }}
                          aria-label={`Adicionar ${proc.nome}`}
                        >
                          + Incluir
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
