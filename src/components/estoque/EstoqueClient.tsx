'use client';

import { useState } from 'react';
import { EstoqueItem, CATEGORIAS } from '@/types/estoque';

interface Props { itensIniciais: EstoqueItem[]; }

function formatQtd(q: number, u: string) { return `${Number(q).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} ${u}`; }

function MovimentoModal({ item, onFechar, onAtualizado }: { item: EstoqueItem; onFechar: () => void; onAtualizado: (i: EstoqueItem) => void }) {
  const [tipo, setTipo] = useState<'entrada'|'saida'|'ajuste'>('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quantidade || Number(quantidade) <= 0) { setErro('Quantidade inválida'); return; }
    setLoading(true); setErro('');
    const res = await fetch(`/api/estoque/${item.id}/movimento`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, quantidade: Number(quantidade), motivo }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErro(data.error); return; }
    onAtualizado(data.item);
    onFechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={e => { if (e.target === e.currentTarget) onFechar(); }}>
      <div className="card-elevated w-full max-w-sm rounded-modal">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="heading text-offwhite text-base">Registrar Movimento</h2>
          <button onClick={onFechar} className="text-muted hover:text-offwhite text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <p className="text-offwhite text-sm font-medium">{item.nome}</p>
          <p className="text-muted text-xs">Estoque atual: {formatQtd(item.quantidade, item.unidade)}</p>
          <div>
            <label className="table-header block mb-1">Tipo</label>
            <select className="input-field" value={tipo} onChange={e => setTipo(e.target.value as 'entrada'|'saida'|'ajuste')}>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
              <option value="ajuste">Ajuste (definir quantidade)</option>
            </select>
          </div>
          <div>
            <label className="table-header block mb-1">{tipo === 'ajuste' ? 'Nova quantidade' : 'Quantidade'}</label>
            <input type="number" min="0" step="0.001" className="input-field" value={quantidade} onChange={e => setQuantidade(e.target.value)} required />
          </div>
          <div>
            <label className="table-header block mb-1">Motivo</label>
            <input className="input-field" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Opcional" />
          </div>
          {erro && <p className="text-error text-xs">{erro}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onFechar} className="btn-ghost flex-1">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Salvando...' : 'Registrar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ItemModal({ item, onFechar, onSalvo }: { item?: EstoqueItem | null; onFechar: () => void; onSalvo: (i: EstoqueItem) => void }) {
  const [nome, setNome] = useState(item?.nome ?? '');
  const [categoria, setCategoria] = useState(item?.categoria ?? '');
  const [unidade, setUnidade] = useState(item?.unidade ?? 'un');
  const [qmin, setQmin] = useState(String(item?.quantidade_minima ?? 0));
  const [valor, setValor] = useState(item?.valor_unitario ? String(item.valor_unitario) : '');
  const [fornecedor, setFornecedor] = useState(item?.fornecedor ?? '');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErro('');
    const payload = { nome, categoria: categoria || null, unidade, quantidade_minima: Number(qmin), valor_unitario: valor ? Number(valor) : null, fornecedor: fornecedor || null };
    const url = item ? `/api/estoque/${item.id}` : '/api/estoque';
    const method = item ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErro(data.error); return; }
    onSalvo(data); onFechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={e => { if (e.target === e.currentTarget) onFechar(); }}>
      <div className="card-elevated w-full max-w-md rounded-modal">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="heading text-offwhite text-base">{item ? 'Editar Item' : 'Novo Item'}</h2>
          <button onClick={onFechar} className="text-muted hover:text-offwhite text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div><label className="table-header block mb-1">Nome *</label><input className="input-field" value={nome} onChange={e => setNome(e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="table-header block mb-1">Categoria</label>
              <select className="input-field" value={categoria} onChange={e => setCategoria(e.target.value)}>
                <option value="">—</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="table-header block mb-1">Unidade</label><input className="input-field" value={unidade} onChange={e => setUnidade(e.target.value)} placeholder="un, ml, cx..." /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="table-header block mb-1">Estoque mínimo</label><input type="number" min="0" step="0.001" className="input-field" value={qmin} onChange={e => setQmin(e.target.value)} /></div>
            <div><label className="table-header block mb-1">Valor unit. (R$)</label><input type="number" min="0" step="0.01" className="input-field" value={valor} onChange={e => setValor(e.target.value)} /></div>
          </div>
          <div><label className="table-header block mb-1">Fornecedor</label><input className="input-field" value={fornecedor} onChange={e => setFornecedor(e.target.value)} /></div>
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

export function EstoqueClient({ itensIniciais }: Props) {
  const [itens, setItens] = useState<EstoqueItem[]>(itensIniciais);
  const [filtro, setFiltro] = useState<'todos'|'baixo'>('todos');
  const [busca, setBusca] = useState('');
  const [itemModal, setItemModal] = useState<EstoqueItem | null | undefined>(undefined);
  const [movModal, setMovModal] = useState<EstoqueItem | null>(null);

  const abaixoMinimo = itens.filter(i => i.quantidade <= i.quantidade_minima && i.quantidade_minima > 0);

  const visíveis = itens.filter(i => {
    if (filtro === 'baixo' && !(i.quantidade <= i.quantidade_minima && i.quantidade_minima > 0)) return false;
    if (busca && !i.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  function onSalvo(item: EstoqueItem) {
    setItens(prev => { const idx = prev.findIndex(i => i.id === item.id); if (idx >= 0) { const n = [...prev]; n[idx] = item; return n; } return [...prev, item]; });
  }

  async function excluir(id: string) {
    if (!confirm('Remover item do estoque?')) return;
    await fetch(`/api/estoque/${id}`, { method: 'DELETE' });
    setItens(prev => prev.filter(i => i.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5" style={{ borderLeft: '3px solid #B89A5A' }}>
          <p className="table-header mb-2">Total de Itens</p>
          <p className="heading text-3xl font-semibold text-offwhite">{itens.length}</p>
          <p className="text-muted text-xs mt-1">{itens.filter(i => i.categoria).length} categorias</p>
        </div>
        <div className="card p-5" style={{ borderLeft: `3px solid ${abaixoMinimo.length > 0 ? '#FBBF24' : '#4ADE80'}` }}>
          <p className="table-header mb-2">Abaixo do Mínimo</p>
          <p className="heading text-3xl font-semibold" style={{ color: abaixoMinimo.length > 0 ? '#FBBF24' : '#4ADE80' }}>{abaixoMinimo.length}</p>
          <div className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1"
            style={{ background: abaixoMinimo.length > 0 ? 'rgba(251,191,36,0.1)' : 'rgba(74,222,128,0.1)', color: abaixoMinimo.length > 0 ? '#FBBF24' : '#4ADE80' }}>
            {abaixoMinimo.length > 0 ? '↓ reposição necessária' : '✓ estoque ok'}
          </div>
        </div>
        <div className="card p-5" style={{ borderLeft: '3px solid #60A5FA' }}>
          <p className="table-header mb-2">Valor Total em Estoque</p>
          <p className="heading text-3xl font-semibold text-offwhite">
            {itens.reduce((s, i) => s + (i.quantidade * (i.valor_unitario ?? 0)), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-muted text-xs mt-1">{itens.length} itens contabilizados</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 lg:gap-3">
        <input className="input-field" style={{ minWidth: 180, maxWidth: 260 }} placeholder="Buscar item..." value={busca} onChange={e => setBusca(e.target.value)} />
        <button onClick={() => setFiltro('todos')} className="btn-ghost text-xs" style={{ borderColor: filtro === 'todos' ? 'rgba(89,57,158,0.5)' : undefined, color: filtro === 'todos' ? '#A07FD4' : undefined }}>Todos</button>
        <button onClick={() => setFiltro('baixo')} className="btn-ghost text-xs" style={{ borderColor: filtro === 'baixo' ? 'rgba(251,191,36,0.5)' : undefined, color: filtro === 'baixo' ? '#FBBF24' : undefined }}>
          Abaixo do mínimo {abaixoMinimo.length > 0 && `(${abaixoMinimo.length})`}
        </button>
        <div className="flex-1" />
        <button onClick={() => setItemModal(null)} className="btn-primary">+ Novo Item</button>
      </div>

      {/* Tabela */}
      <div className="card overflow-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Item','Categoria','Estoque','Mínimo','Valor unit.','Fornecedor',''].map(h => (
                <th key={h} className="table-header text-left px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visíveis.length === 0 && (
              <tr><td colSpan={7} className="text-center text-muted py-10 text-sm">Nenhum item encontrado.</td></tr>
            )}
            {visíveis.map(item => {
              const alerta = item.quantidade_minima > 0 && item.quantidade <= item.quantidade_minima;
              return (
                <tr key={item.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-4 py-3">
                    <span className="text-offwhite text-sm font-medium">{item.nome}</span>
                    {item.codigo && <span className="text-muted ml-2 text-xs">{item.codigo}</span>}
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">{item.categoria ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-sm" style={{ color: alerta ? '#FBBF24' : '#F5F2EA' }}>{formatQtd(item.quantidade, item.unidade)}</span>
                    {alerta && <span className="ml-1 text-xs" style={{ color: '#FBBF24' }}>⚠</span>}
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">{item.quantidade_minima > 0 ? formatQtd(item.quantidade_minima, item.unidade) : '—'}</td>
                  <td className="px-4 py-3 text-muted text-xs">{item.valor_unitario ? `R$ ${Number(item.valor_unitario).toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3 text-muted text-xs">{item.fornecedor ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => setMovModal(item)} className="btn-ghost text-xs" style={{ padding: '0.2rem 0.6rem' }}>Mover</button>
                      <button onClick={() => setItemModal(item)} className="btn-ghost text-xs" style={{ padding: '0.2rem 0.6rem' }}>Editar</button>
                      <button onClick={() => excluir(item.id)} className="btn-ghost text-xs text-error" style={{ padding: '0.2rem 0.6rem', borderColor: 'rgba(248,113,113,0.2)' }}>Excluir</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {itemModal !== undefined && (
        <ItemModal item={itemModal} onFechar={() => setItemModal(undefined)} onSalvo={onSalvo} />
      )}
      {movModal && (
        <MovimentoModal item={movModal} onFechar={() => setMovModal(null)} onAtualizado={onSalvo} />
      )}
    </div>
  );
}
