'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { ContaPagar, ContaStatus, PagarCategoria } from '@/types/financeiro';
import { CONTA_STATUS_CONFIG, PAGAR_CATEGORIA_LABELS, formatBRL } from '@/types/financeiro';

type Filtro = 'todos' | 'pendente' | 'vencido' | 'pago' | 'cancelado';

const hojeStr = () => new Date().toISOString().slice(0, 10);

function statusEfetivo(c: ContaPagar): ContaStatus {
  if (c.status === 'pendente' && c.vencimento < hojeStr()) return 'vencido';
  return c.status;
}

export function PagarClient({ contas }: { contas: ContaPagar[] }) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [novaConta, setNovaConta] = useState(false);
  const [loading, setLoading] = useState('');

  const filtradas = useMemo(() => {
    if (filtro === 'todos') return contas;
    return contas.filter(c => statusEfetivo(c) === filtro);
  }, [contas, filtro]);

  const totais = useMemo(() => {
    const t: Record<Filtro, { count: number; valor: number }> = {
      todos: { count: 0, valor: 0 }, pendente: { count: 0, valor: 0 },
      vencido: { count: 0, valor: 0 }, pago: { count: 0, valor: 0 }, cancelado: { count: 0, valor: 0 },
    };
    for (const c of contas) {
      const s = statusEfetivo(c);
      t.todos.count++; t.todos.valor += Number(c.valor);
      t[s as Filtro].count++; t[s as Filtro].valor += Number(c.valor);
    }
    return t;
  }, [contas]);

  const marcarPago = async (c: ContaPagar) => {
    setLoading('pago-' + c.id);
    try {
      await fetch(`/api/financeiro/pagar/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pago', valor_pago: c.valor }),
      });
      router.refresh();
    } finally {
      setLoading('');
    }
  };

  const excluir = async (c: ContaPagar) => {
    setLoading('del-' + c.id);
    try {
      await fetch(`/api/financeiro/pagar/${c.id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setLoading('');
    }
  };

  const FILTROS: { key: Filtro; label: string; cor: string }[] = [
    { key: 'todos', label: 'Todas', cor: '#6B6B66' },
    { key: 'pendente', label: 'Pendentes', cor: '#FBBF24' },
    { key: 'vencido', label: 'Vencidas', cor: '#F87171' },
    { key: 'pago', label: 'Pagas', cor: '#4ADE80' },
  ];

  return (
    <div>
      <div className="flex gap-3 mb-6 flex-wrap">
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className="card text-left transition-colors"
            style={{
              padding: '12px 18px', minWidth: 130, cursor: 'pointer',
              border: `1px solid ${filtro === f.key ? f.cor : 'rgba(255,255,255,0.07)'}`,
            }}
          >
            <div style={{ fontSize: 10, color: f.cor, fontFamily: 'var(--font-montserrat)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {f.label}
            </div>
            <div className="text-offwhite font-bold" style={{ fontFamily: 'var(--font-montserrat)', fontSize: 16 }}>
              {totais[f.key].count} <span className="text-muted" style={{ fontSize: 11, fontWeight: 400 }}>· {formatBRL(totais[f.key].valor)}</span>
            </div>
          </button>
        ))}
        <button
          onClick={() => setNovaConta(true)}
          className="btn-primary text-xs ml-auto self-center"
          style={{ padding: '10px 18px' }}
        >
          + Nova Despesa
        </button>
      </div>

      {filtradas.length === 0 ? (
        <div className="card text-center py-16" style={{ borderStyle: 'dashed', borderColor: 'rgba(31,122,77,0.15)' }}>
          <p className="text-muted text-sm">Nenhuma despesa neste filtro.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Descrição', 'Categoria', 'Fornecedor', 'Vencimento', 'Valor', 'Status', ''].map(h => (
                  <th key={h} className="table-header" style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.map(c => {
                const st = statusEfetivo(c);
                const cfg = CONTA_STATUS_CONFIG[st];
                return (
                  <tr key={c.id} className="table-row-hover" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '11px 14px' }}>
                      <span className="text-offwhite" style={{ fontSize: 12 }}>{c.descricao}</span>
                      {c.recorrente && <span className="text-muted block" style={{ fontSize: 9 }}>↻ recorrente</span>}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span className="text-muted" style={{ fontSize: 11 }}>{PAGAR_CATEGORIA_LABELS[c.categoria]}</span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span className="text-muted" style={{ fontSize: 11 }}>{c.fornecedor ?? '—'}</span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ fontSize: 12, color: st === 'vencido' ? '#F87171' : '#1C1C1C' }}>
                        {new Date(c.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span className="text-offwhite font-semibold" style={{ fontSize: 12, fontFamily: 'var(--font-montserrat)' }}>{formatBRL(Number(c.valor))}</span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 9 }}>
                        {cfg.label.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {(st === 'pendente' || st === 'vencido') && (
                        <button
                          onClick={() => marcarPago(c)}
                          disabled={!!loading}
                          className="btn-primary"
                          style={{ fontSize: 10, padding: '4px 10px', marginRight: 6 }}
                        >
                          {loading === 'pago-' + c.id ? '...' : 'Marcar Pago'}
                        </button>
                      )}
                      <button
                        onClick={() => excluir(c)}
                        disabled={!!loading}
                        className="btn-ghost"
                        style={{ fontSize: 10, padding: '4px 8px', color: '#F87171' }}
                      >
                        {loading === 'del-' + c.id ? '...' : '✕'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {novaConta && <NovaDespesaModal onClose={() => setNovaConta(false)} />}
    </div>
  );
}

function NovaDespesaModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<PagarCategoria>('outros');
  const [fornecedor, setFornecedor] = useState('');
  const [valor, setValor] = useState('');
  const [vencimento, setVencimento] = useState(hojeStr());
  const [recorrente, setRecorrente] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const salvar = async () => {
    if (!descricao || !valor || !vencimento) { setErro('Preencha descrição, valor e vencimento'); return; }
    setLoading(true);
    setErro('');
    try {
      const res = await fetch('/api/financeiro/pagar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao,
          categoria,
          fornecedor: fornecedor || null,
          valor: parseFloat(valor),
          vencimento,
          recorrente,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setErro(data.error ?? 'Erro ao salvar'); return; }
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
      <div className="card" style={{ width: 460, maxWidth: '95vw', padding: 28 }}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 24, color: '#1C1C1C', fontWeight: 500 }}>Nova Despesa</h2>
          <button onClick={onClose} style={{ color: '#6B6B66', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-muted block mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição</label>
            <input className="input-field w-full" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Material laboratório" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-muted block mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categoria</label>
              <select className="input-field w-full" value={categoria} onChange={e => setCategoria(e.target.value as PagarCategoria)}>
                {(Object.keys(PAGAR_CATEGORIA_LABELS) as PagarCategoria[]).map(k => (
                  <option key={k} value={k}>{PAGAR_CATEGORIA_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-muted block mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fornecedor</label>
              <input className="input-field w-full" value={fornecedor} onChange={e => setFornecedor(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-muted block mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor (R$)</label>
              <input type="number" step="0.01" className="input-field w-full" value={valor} onChange={e => setValor(e.target.value)} />
            </div>
            <div>
              <label className="text-muted block mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vencimento</label>
              <input type="date" className="input-field w-full" value={vencimento} onChange={e => setVencimento(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={recorrente} onChange={e => setRecorrente(e.target.checked)} style={{ accentColor: '#1F7A4D' }} />
            <span className="text-muted text-xs">Despesa recorrente (mensal)</span>
          </label>
          {erro && <p style={{ fontSize: 12, color: '#F87171', fontFamily: 'var(--font-montserrat)' }}>{erro}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={onClose} className="btn-ghost text-xs" style={{ padding: '8px 16px' }}>Cancelar</button>
            <button onClick={salvar} disabled={loading} className="btn-primary text-xs" style={{ padding: '8px 20px' }}>
              {loading ? '...' : 'Criar Despesa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
