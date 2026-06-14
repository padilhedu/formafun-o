'use client';

import { useState } from 'react';
import type { ProcedimentoRow } from '../ConfiguracoesClient';

interface Props { procedimentos: ProcedimentoRow[]; }

const CATEGORIAS = ['Consulta', 'Diagnóstico', 'Prevenção', 'Restauração', 'Endodontia', 'Cirurgia', 'Implante', 'Prótese', 'Ortodontia', 'Estética', 'Periodontia', 'Outro'];

function Modal({ item, onFechar, onSalvo }: {
  item?: ProcedimentoRow | null;
  onFechar: () => void;
  onSalvo: (p: ProcedimentoRow) => void;
}) {
  const [nome, setNome] = useState(item?.nome ?? '');
  const [codigo, setCodigo] = useState(item?.codigo ?? '');
  const [cat, setCat] = useState(item?.categoria ?? '');
  const [valor, setValor] = useState(item?.valor_base ? String(item.valor_base) : '');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome) { setErro('Nome obrigatório'); return; }
    setLoading(true); setErro('');
    const payload = { nome, codigo: codigo || null, categoria: cat || null, valor_base: valor ? Number(valor) : null };
    const url = item ? `/api/configuracoes/procedimentos/${item.id}` : '/api/configuracoes/procedimentos';
    const method = item ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErro(data.error); return; }
    onSalvo(data); onFechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onFechar(); }}>
      <div className="card-elevated w-full max-w-md rounded-modal">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="heading text-offwhite text-base">{item ? 'Editar Procedimento' : 'Novo Procedimento'}</h2>
          <button onClick={onFechar} className="text-muted text-xl">×</button>
        </div>
        <form onSubmit={submit} className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="table-header block mb-1">Nome *</label>
              <input className="input-field" value={nome} onChange={e => setNome(e.target.value)} required />
            </div>
            <div>
              <label className="table-header block mb-1">Código</label>
              <input className="input-field" value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Ex: 81000022" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="table-header block mb-1">Categoria</label>
              <select className="input-field" value={cat} onChange={e => setCat(e.target.value)}>
                <option value="">—</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="table-header block mb-1">Valor Padrão (R$)</label>
              <input type="number" min="0" step="0.01" className="input-field" value={valor} onChange={e => setValor(e.target.value)} />
            </div>
          </div>
          {erro && <p className="text-error text-xs">{erro}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onFechar} className="btn-ghost flex-1">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Salvando...' : item ? 'Salvar' : 'Criar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TabProcedimentos({ procedimentos: initial }: Props) {
  const [lista, setLista] = useState<ProcedimentoRow[]>(initial);
  const [modal, setModal] = useState<ProcedimentoRow | null | undefined>(undefined);
  const [busca, setBusca] = useState('');
  const [catFiltro, setCatFiltro] = useState('');

  function onSalvo(p: ProcedimentoRow) {
    setLista(prev => {
      const idx = prev.findIndex(x => x.id === p.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = p; return n; }
      return [...prev, p];
    });
  }

  async function toggleAtivo(p: ProcedimentoRow) {
    const res = await fetch(`/api/configuracoes/procedimentos/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !p.ativo }),
    });
    if (res.ok) onSalvo({ ...p, ativo: !p.ativo });
  }

  const visivel = lista.filter(p => {
    if (!p.ativo) return false;
    if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    if (catFiltro && p.categoria !== catFiltro) return false;
    return true;
  });

  const cats = [...new Set(lista.map(p => p.categoria).filter(Boolean))] as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="heading text-offwhite" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem' }}>Tabela de Procedimentos</h2>
        <button onClick={() => setModal(null)} className="btn-primary" style={{ padding: '6px 18px', fontSize: 12 }}>+ Novo</button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input className="input-field" style={{ maxWidth: 220 }} placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} />
        <select className="input-field" style={{ maxWidth: 160 }} value={catFiltro} onChange={e => setCatFiltro(e.target.value)}>
          <option value="">Todas categorias</option>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-muted text-xs self-center">{visivel.length} procedimentos</span>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
          <thead>
            <tr>
              {['Código', 'Procedimento', 'Categoria', 'Valor Padrão', ''].map(h => (
                <th key={h} className="table-header" style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visivel.length === 0 && (
              <tr><td colSpan={5} className="text-center text-muted py-12 text-sm">Nenhum procedimento encontrado.</td></tr>
            )}
            {visivel.map(p => (
              <tr key={p.id} className="table-row-hover" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '11px 16px' }}>
                  <span className="text-muted text-xs">{p.codigo ?? '—'}</span>
                </td>
                <td style={{ padding: '11px 16px' }}>
                  <div className="text-offwhite text-sm font-medium">{p.nome}</div>
                  {p.duracao_min && <div className="text-muted text-xs mt-0.5">{p.duracao_min} min</div>}
                </td>
                <td style={{ padding: '11px 16px' }}>
                  <span className="text-muted text-xs">{p.categoria ?? '—'}</span>
                </td>
                <td style={{ padding: '11px 16px' }}>
                  <span className="text-offwhite text-sm">{p.valor_base ? `R$ ${Number(p.valor_base).toFixed(2)}` : '—'}</span>
                </td>
                <td style={{ padding: '11px 16px' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => setModal(p)} className="btn-ghost" style={{ padding: '3px 10px', fontSize: 11 }}>Editar</button>
                    <button onClick={() => toggleAtivo(p)} className="btn-ghost" style={{ padding: '3px 10px', fontSize: 11, color: '#F87171', borderColor: 'rgba(248,113,113,0.2)' }}>Inativar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal !== undefined && (
        <Modal item={modal} onFechar={() => setModal(undefined)} onSalvo={onSalvo} />
      )}
    </div>
  );
}
