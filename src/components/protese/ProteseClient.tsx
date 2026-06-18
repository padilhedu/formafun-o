'use client';

import { useState } from 'react';
import { ProtesePedido, ProteseStatus, STATUS_LABEL, STATUS_COR, TIPOS_PROTESE } from '@/types/protese';

interface Paciente { id: string; nome: string; }
interface Props { pedidosIniciais: ProtesePedido[]; pacientes: Paciente[]; }

function PedidoModal({ pedido, pacientes, onFechar, onSalvo, onExcluido }: {
  pedido?: ProtesePedido | null; pacientes: Paciente[];
  onFechar: () => void; onSalvo: (p: ProtesePedido) => void; onExcluido?: (id: string) => void;
}) {
  const [tipo, setTipo] = useState(pedido?.tipo ?? '');
  const [tipoCustom, setTipoCustom] = useState(!TIPOS_PROTESE.includes(pedido?.tipo ?? '') ? pedido?.tipo ?? '' : '');
  const [pacienteId, setPacienteId] = useState(pedido?.paciente_id ?? '');
  const [status, setStatus] = useState<ProteseStatus>(pedido?.status ?? 'solicitado');
  const [cor, setCor] = useState(pedido?.cor ?? '');
  const [medidas, setMedidas] = useState(pedido?.medidas ?? '');
  const [lab, setLab] = useState(pedido?.laboratorio ?? '');
  const [prazo, setPrazo] = useState(pedido?.prazo ?? '');
  const [valor, setValor] = useState(pedido?.valor ? String(pedido.valor) : '');
  const [obs, setObs] = useState(pedido?.observacoes ?? '');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const tipoFinal = tipo === '__custom' ? tipoCustom : tipo;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tipoFinal) { setErro('Selecione o tipo'); return; }
    setLoading(true); setErro('');
    const payload = { tipo: tipoFinal, paciente_id: pacienteId || null, status, cor: cor || null, medidas: medidas || null, laboratorio: lab || null, prazo: prazo || null, valor: valor ? Number(valor) : null, observacoes: obs || null };
    const url = pedido ? `/api/protese/${pedido.id}` : '/api/protese';
    const method = pedido ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErro(data.error); return; }
    onSalvo(data); onFechar();
  }

  async function excluir() {
    if (!pedido || !onExcluido) return;
    if (!confirm('Excluir pedido?')) return;
    await fetch(`/api/protese/${pedido.id}`, { method: 'DELETE' });
    onExcluido(pedido.id); onFechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={e => { if (e.target === e.currentTarget) onFechar(); }}>
      <div className="card-elevated w-full max-w-lg rounded-modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="heading text-offwhite text-base">{pedido ? 'Editar Pedido' : 'Novo Pedido de Prótese'}</h2>
          <button onClick={onFechar} className="text-muted hover:text-offwhite text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="table-header block mb-1">Tipo *</label>
            <select className="input-field" value={TIPOS_PROTESE.includes(tipo) ? tipo : tipo ? '__custom' : ''} onChange={e => { const v = e.target.value; if (v === '__custom') setTipo('__custom'); else { setTipo(v); setTipoCustom(''); } }} required>
              <option value="">— Selecione —</option>
              {TIPOS_PROTESE.map(t => <option key={t} value={t}>{t}</option>)}
              <option value="__custom">Outro...</option>
            </select>
            {tipo === '__custom' && <input className="input-field mt-2" placeholder="Descreva o tipo" value={tipoCustom} onChange={e => setTipoCustom(e.target.value)} required />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="table-header block mb-1">Paciente</label>
              <select className="input-field" value={pacienteId} onChange={e => setPacienteId(e.target.value)}>
                <option value="">—</option>
                {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="table-header block mb-1">Status</label>
              <select className="input-field" value={status} onChange={e => setStatus(e.target.value as ProteseStatus)}>
                {(Object.keys(STATUS_LABEL) as ProteseStatus[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="table-header block mb-1">Cor/Tonalidade</label><input className="input-field" value={cor} onChange={e => setCor(e.target.value)} placeholder="Ex: A2, Vita 22" /></div>
            <div><label className="table-header block mb-1">Laboratório</label><input className="input-field" value={lab} onChange={e => setLab(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="table-header block mb-1">Prazo</label><input type="date" className="input-field" value={prazo} onChange={e => setPrazo(e.target.value)} /></div>
            <div><label className="table-header block mb-1">Valor (R$)</label><input type="number" min="0" step="0.01" className="input-field" value={valor} onChange={e => setValor(e.target.value)} /></div>
          </div>
          <div><label className="table-header block mb-1">Medidas / Moldagem</label><textarea className="input-field" rows={2} value={medidas} onChange={e => setMedidas(e.target.value)} /></div>
          <div><label className="table-header block mb-1">Observações</label><textarea className="input-field" rows={2} value={obs} onChange={e => setObs(e.target.value)} /></div>
          {erro && <p className="text-error text-xs">{erro}</p>}
          <div className="flex gap-2 pt-1">
            {pedido && onExcluido && <button type="button" onClick={excluir} className="btn-ghost text-error text-xs border-error/20">Excluir</button>}
            <div className="flex-1" />
            <button type="button" onClick={onFechar} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Salvando...' : pedido ? 'Salvar' : 'Criar Pedido'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ProteseClient({ pedidosIniciais, pacientes }: Props) {
  const [pedidos, setPedidos] = useState<ProtesePedido[]>(pedidosIniciais);
  const [modal, setModal] = useState<ProtesePedido | null | undefined>(undefined);
  const [filtroStatus, setFiltroStatus] = useState<ProteseStatus | 'todos'>('todos');

  const visiveis = filtroStatus === 'todos' ? pedidos : pedidos.filter(p => p.status === filtroStatus);

  function onSalvo(p: ProtesePedido) {
    setPedidos(prev => { const idx = prev.findIndex(x => x.id === p.id); if (idx >= 0) { const n = [...prev]; n[idx] = p; return n; } return [...prev, p]; });
  }
  function onExcluido(id: string) { setPedidos(prev => prev.filter(p => p.id !== id)); }

  const emAberto = pedidos.filter(p => !['entregue','cancelado'].includes(p.status)).length;
  const prontos = pedidos.filter(p => p.status === 'pronto').length;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5" style={{ borderLeft: '3px solid #1F7A4D' }}>
          <p className="table-header mb-2">Em Aberto</p>
          <p className="heading text-3xl font-semibold text-offwhite">{emAberto}</p>
          <p className="text-muted text-xs mt-1">pedidos ativos</p>
        </div>
        <div className="card p-5" style={{ borderLeft: `3px solid ${prontos > 0 ? '#4ADE80' : '#6B6B66'}` }}>
          <p className="table-header mb-2">Prontos para Entrega</p>
          <p className="heading text-3xl font-semibold" style={{ color: prontos > 0 ? '#4ADE80' : '#1C1C1C' }}>{prontos}</p>
          <div className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1"
            style={{ background: prontos > 0 ? 'rgba(74,222,128,0.1)' : 'rgba(138,138,147,0.1)', color: prontos > 0 ? '#4ADE80' : '#6B6B66' }}>
            {prontos > 0 ? '↑ aguardando retirada' : '— nenhum pronto'}
          </div>
        </div>
        <div className="card p-5" style={{ borderLeft: '3px solid #60A5FA' }}>
          <p className="table-header mb-2">Total de Pedidos</p>
          <p className="heading text-3xl font-semibold text-offwhite">{pedidos.length}</p>
          <p className="text-muted text-xs mt-1">{pedidos.filter(p => p.status === 'entregue').length} entregues</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['todos', ...Object.keys(STATUS_LABEL)] as (ProteseStatus | 'todos')[]).map(s => (
          <button key={s} onClick={() => setFiltroStatus(s)} className="btn-ghost text-xs" style={{
            padding: '0.25rem 0.65rem',
            color: filtroStatus === s ? '#fff' : undefined,
            background: filtroStatus === s ? (s === 'todos' ? '#1F7A4D' : STATUS_COR[s as ProteseStatus]) : undefined,
            borderColor: filtroStatus === s ? 'transparent' : undefined,
          }}>
            {s === 'todos' ? 'Todos' : STATUS_LABEL[s as ProteseStatus]}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={() => setModal(null)} className="btn-primary">+ Novo Pedido</button>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Tipo','Paciente','Laboratório','Prazo','Valor','Status',''].map(h => (
                <th key={h} className="table-header text-left px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visiveis.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-10 text-sm">Nenhum pedido encontrado.</td></tr>}
            {visiveis.map(p => {
              const atrasado = p.prazo && p.status !== 'entregue' && p.status !== 'cancelado' && new Date(p.prazo) < new Date();
              return (
                <tr key={p.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-4 py-3 text-offwhite text-sm font-medium">{p.tipo}</td>
                  <td className="px-4 py-3 text-muted text-xs">{p.pacientes?.nome ?? '—'}</td>
                  <td className="px-4 py-3 text-muted text-xs">{p.laboratorio ?? '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: atrasado ? '#F87171' : '#6B6B66' }}>
                    {p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR') : '—'}
                    {atrasado && ' ⚠'}
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">{p.valor ? `R$ ${Number(p.valor).toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className="badge" style={{ background: `${STATUS_COR[p.status]}22`, color: STATUS_COR[p.status], border: `1px solid ${STATUS_COR[p.status]}44` }}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setModal(p)} className="btn-ghost text-xs" style={{ padding: '0.2rem 0.6rem' }}>Editar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal !== undefined && (
        <PedidoModal pedido={modal} pacientes={pacientes} onFechar={() => setModal(undefined)} onSalvo={onSalvo} onExcluido={onExcluido} />
      )}
    </div>
  );
}
