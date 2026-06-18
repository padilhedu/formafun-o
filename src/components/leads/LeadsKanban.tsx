'use client';

import { useState } from 'react';
import { Lead, LeadStatus, LeadOrigem, STATUS_LABEL, STATUS_COR, ORIGEM_LABEL } from '@/types/leads';

interface Props { leadsIniciais: Lead[]; }

const COLUNAS: LeadStatus[] = ['novo', 'contato', 'agendado', 'convertido', 'perdido'];

function LeadModal({ lead, onFechar, onSalvo, onExcluido }: {
  lead?: Lead | null; onFechar: () => void;
  onSalvo: (l: Lead) => void; onExcluido?: (id: string) => void;
}) {
  const [nome, setNome] = useState(lead?.nome ?? '');
  const [telefone, setTelefone] = useState(lead?.telefone ?? '');
  const [email, setEmail] = useState(lead?.email ?? '');
  const [origem, setOrigem] = useState<LeadOrigem>(lead?.origem ?? 'outros');
  const [status, setStatus] = useState<LeadStatus>(lead?.status ?? 'novo');
  const [obs, setObs] = useState(lead?.observacoes ?? '');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErro('');
    const payload = { nome, telefone: telefone || null, email: email || null, origem, status, observacoes: obs || null };
    const url = lead ? `/api/leads/${lead.id}` : '/api/leads';
    const method = lead ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErro(data.error); return; }
    onSalvo(data); onFechar();
  }

  async function excluir() {
    if (!lead || !onExcluido) return;
    if (!confirm('Excluir lead?')) return;
    await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' });
    onExcluido(lead.id); onFechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={e => { if (e.target === e.currentTarget) onFechar(); }}>
      <div className="card-elevated w-full max-w-md rounded-modal">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="heading text-offwhite text-base">{lead ? 'Editar Lead' : 'Novo Lead'}</h2>
          <button onClick={onFechar} className="text-muted hover:text-offwhite text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div><label className="table-header block mb-1">Nome *</label><input className="input-field" value={nome} onChange={e => setNome(e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="table-header block mb-1">Telefone</label><input className="input-field" value={telefone} onChange={e => setTelefone(e.target.value)} /></div>
            <div><label className="table-header block mb-1">E-mail</label><input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="table-header block mb-1">Origem</label>
              <select className="input-field" value={origem} onChange={e => setOrigem(e.target.value as LeadOrigem)}>
                {(Object.keys(ORIGEM_LABEL) as LeadOrigem[]).map(o => <option key={o} value={o}>{ORIGEM_LABEL[o]}</option>)}
              </select>
            </div>
            <div>
              <label className="table-header block mb-1">Status</label>
              <select className="input-field" value={status} onChange={e => setStatus(e.target.value as LeadStatus)}>
                {COLUNAS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
          </div>
          <div><label className="table-header block mb-1">Observações</label><textarea className="input-field" rows={2} value={obs} onChange={e => setObs(e.target.value)} /></div>
          {erro && <p className="text-error text-xs">{erro}</p>}
          <div className="flex gap-2 pt-1">
            {lead && onExcluido && <button type="button" onClick={excluir} className="btn-ghost text-error text-xs border-error/20">Excluir</button>}
            <div className="flex-1" />
            <button type="button" onClick={onFechar} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Salvando...' : lead ? 'Salvar' : 'Criar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LeadsKanban({ leadsIniciais }: Props) {
  const [leads, setLeads] = useState<Lead[]>(leadsIniciais);
  const [modal, setModal] = useState<Lead | null | undefined>(undefined);

  function onSalvo(l: Lead) {
    setLeads(prev => { const idx = prev.findIndex(x => x.id === l.id); if (idx >= 0) { const n = [...prev]; n[idx] = l; return n; } return [...prev, l]; });
  }

  function onExcluido(id: string) { setLeads(prev => prev.filter(l => l.id !== id)); }

  async function moverStatus(id: string, novoStatus: LeadStatus) {
    const res = await fetch(`/api/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: novoStatus }) });
    if (res.ok) { const data = await res.json(); onSalvo(data); }
  }

  const convertidos = leads.filter(l => l.status === 'convertido').length;
  const perdidos = leads.filter(l => l.status === 'perdido').length;
  const ativos = leads.filter(l => !['convertido','perdido'].includes(l.status)).length;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-5" style={{ borderLeft: '3px solid #1F7A4D' }}>
          <p className="table-header mb-2">Total de Leads</p>
          <p className="heading text-3xl font-semibold text-offwhite">{leads.length}</p>
          <p className="text-muted text-xs mt-1">{ativos} em andamento</p>
        </div>
        <div className="card p-5" style={{ borderLeft: '3px solid #4ADE80' }}>
          <p className="table-header mb-2">Convertidos</p>
          <p className="heading text-3xl font-semibold" style={{ color: '#4ADE80' }}>{convertidos}</p>
          <div className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1"
            style={{ background: 'rgba(74,222,128,0.1)', color: '#4ADE80' }}>
            {leads.length > 0 ? `${Math.round((convertidos / leads.length) * 100)}% taxa` : '—'}
          </div>
        </div>
        <div className="card p-5" style={{ borderLeft: '3px solid #FBBF24' }}>
          <p className="table-header mb-2">Em Andamento</p>
          <p className="heading text-3xl font-semibold" style={{ color: '#FBBF24' }}>{ativos}</p>
          <p className="text-muted text-xs mt-1">aguardando ação</p>
        </div>
        <div className="card p-5" style={{ borderLeft: '3px solid #F87171' }}>
          <p className="table-header mb-2">Perdidos</p>
          <p className="heading text-3xl font-semibold" style={{ color: '#F87171' }}>{perdidos}</p>
          <p className="text-muted text-xs mt-1">não convertidos</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div />
        <button onClick={() => setModal(null)} className="btn-primary">+ Novo Lead</button>
      </div>

      {/* Kanban */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(5, 1fr)', minWidth: 900, overflowX: 'auto' }}>
        {COLUNAS.map(colStatus => {
          const colLeads = leads.filter(l => l.status === colStatus);
          return (
            <div key={colStatus} className="flex flex-col gap-2">
              {/* Header coluna */}
              <div className="flex items-center gap-2 mb-1">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COR[colStatus], flexShrink: 0 }} />
                <span className="table-header">{STATUS_LABEL[colStatus]}</span>
                <span className="ml-auto text-muted" style={{ fontSize: '0.65rem', fontWeight: 700 }}>{colLeads.length}</span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2" style={{ minHeight: 120 }}>
                {colLeads.map(lead => (
                  <div
                    key={lead.id}
                    className="card cursor-pointer"
                    style={{ padding: '0.75rem', borderLeft: `3px solid ${STATUS_COR[colStatus]}` }}
                    onClick={() => setModal(lead)}
                  >
                    <p className="text-offwhite font-medium" style={{ fontSize: '0.78rem', lineHeight: 1.3 }}>{lead.nome}</p>
                    {lead.telefone && <p className="text-muted" style={{ fontSize: '0.65rem', marginTop: 2 }}>{lead.telefone}</p>}
                    <div className="flex items-center gap-1 mt-2">
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#6B6B66', fontSize: '0.58rem', padding: '0.1rem 0.4rem', textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>
                        {ORIGEM_LABEL[lead.origem ?? 'outros']}
                      </span>
                    </div>
                    {/* Avançar/Recuar rápido */}
                    <div className="flex gap-1 mt-2" onClick={e => e.stopPropagation()}>
                      {COLUNAS.indexOf(colStatus) > 0 && (
                        <button onClick={() => moverStatus(lead.id, COLUNAS[COLUNAS.indexOf(colStatus) - 1])} className="text-muted hover:text-offwhite" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', borderRadius: 4, padding: '1px 5px' }}>‹</button>
                      )}
                      {COLUNAS.indexOf(colStatus) < COLUNAS.length - 1 && (
                        <button onClick={() => moverStatus(lead.id, COLUNAS[COLUNAS.indexOf(colStatus) + 1])} className="text-muted hover:text-offwhite" style={{ fontSize: '0.65rem', background: 'rgba(31,122,77,0.15)', borderRadius: 4, padding: '1px 5px' }}>›</button>
                      )}
                    </div>
                  </div>
                ))}
                {colLeads.length === 0 && (
                  <div style={{ border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="text-muted" style={{ fontSize: '0.65rem' }}>Vazio</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal !== undefined && (
        <LeadModal lead={modal} onFechar={() => setModal(undefined)} onSalvo={onSalvo} onExcluido={onExcluido} />
      )}
    </div>
  );
}
