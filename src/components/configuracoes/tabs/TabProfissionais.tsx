'use client';

import { useState } from 'react';
import type { ProfissionalRow } from '../ConfiguracoesClient';

interface Props { profissionais: ProfissionalRow[]; }

const ESPECIALIDADES = ['Clínico Geral', 'Ortodontia', 'Implantodontia', 'Endodontia', 'Periodontia', 'Cirurgia', 'Prótese', 'Estética', 'Odontopediatria', 'Outro'];
const CORES = ['#1F7A4D', '#4ADE80', '#60A5FA', '#F87171', '#FBBF24', '#8B5CF6', '#EC4899', '#F97316'];

function Modal({ item, onFechar, onSalvo }: {
  item?: ProfissionalRow | null;
  onFechar: () => void;
  onSalvo: (p: ProfissionalRow) => void;
}) {
  const [nome, setNome] = useState(item?.nome ?? '');
  const [cro, setCro] = useState(item?.cro ?? '');
  const [esp, setEsp] = useState(item?.especialidade ?? '');
  const [cor, setCor] = useState(item?.cor ?? '#1F7A4D');
  const [comissao, setComissao] = useState(String(item?.comissao_percentual ?? 0));
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome) { setErro('Nome obrigatório'); return; }
    setLoading(true); setErro('');
    const payload = { nome, cro, especialidade: esp, cor, comissao_percentual: Number(comissao) };
    const url = item ? `/api/configuracoes/profissionais/${item.id}` : '/api/configuracoes/profissionais';
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
          <h2 className="heading text-offwhite text-base">{item ? 'Editar Profissional' : 'Novo Profissional'}</h2>
          <button onClick={onFechar} className="text-muted text-xl">×</button>
        </div>
        <form onSubmit={submit} className="px-5 py-4 space-y-3">
          <div>
            <label className="table-header block mb-1">Nome *</label>
            <input className="input-field" value={nome} onChange={e => setNome(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="table-header block mb-1">CRO</label>
              <input className="input-field" value={cro} onChange={e => setCro(e.target.value)} placeholder="SC-00000" />
            </div>
            <div>
              <label className="table-header block mb-1">Comissão (%)</label>
              <input type="number" min="0" max="100" step="0.5" className="input-field" value={comissao} onChange={e => setComissao(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="table-header block mb-1">Especialidade</label>
            <select className="input-field" value={esp} onChange={e => setEsp(e.target.value)}>
              <option value="">—</option>
              {ESPECIALIDADES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="table-header block mb-2">Cor na agenda</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CORES.map(c => (
                <button key={c} type="button" onClick={() => setCor(c)} style={{
                  width: 28, height: 28, borderRadius: 6, background: c, border: 'none', cursor: 'pointer',
                  outline: cor === c ? '2px solid #1C1C1C' : '2px solid transparent', outlineOffset: 2,
                }} />
              ))}
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

export function TabProfissionais({ profissionais: initial }: Props) {
  const [lista, setLista] = useState<ProfissionalRow[]>(initial);
  const [modal, setModal] = useState<ProfissionalRow | null | undefined>(undefined);

  function onSalvo(p: ProfissionalRow) {
    setLista(prev => {
      const idx = prev.findIndex(x => x.id === p.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = p; return n; }
      return [...prev, p];
    });
  }

  async function toggleAtivo(p: ProfissionalRow) {
    const res = await fetch(`/api/configuracoes/profissionais/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !p.ativo }),
    });
    if (res.ok) onSalvo({ ...p, ativo: !p.ativo });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="heading text-offwhite" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem' }}>Profissionais</h2>
        <button onClick={() => setModal(null)} className="btn-primary" style={{ padding: '6px 18px', fontSize: 12 }}>+ Novo</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
          <thead>
            <tr>
              {['Profissional', 'CRO', 'Especialidade', 'Comissão', 'Agenda', 'Status', ''].map(h => (
                <th key={h} className="table-header" style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr><td colSpan={7} className="text-center text-muted py-12 text-sm">Nenhum profissional cadastrado.</td></tr>
            )}
            {lista.map(p => (
              <tr key={p.id} className="table-row-hover" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <span className="text-offwhite text-sm font-medium">{p.nome}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="text-muted text-xs">{p.cro ?? '—'}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="text-muted text-xs">{p.especialidade ?? '—'}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="text-muted text-xs">{p.comissao_percentual ? `${p.comissao_percentual}%` : '—'}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: p.cor ?? '#1F7A4D' }} />
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="badge" style={{
                    background: p.ativo ? 'rgba(74,222,128,0.1)' : 'rgba(138,138,147,0.1)',
                    color: p.ativo ? '#4ADE80' : '#6B6B66',
                    border: `1px solid ${p.ativo ? 'rgba(74,222,128,0.25)' : 'rgba(138,138,147,0.15)'}`,
                    fontSize: 10,
                  }}>{p.ativo ? 'Ativo' : 'Inativo'}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => setModal(p)} className="btn-ghost" style={{ padding: '3px 10px', fontSize: 11 }}>Editar</button>
                    <button onClick={() => toggleAtivo(p)} className="btn-ghost" style={{ padding: '3px 10px', fontSize: 11, color: '#6B6B66' }}>
                      {p.ativo ? 'Inativar' : 'Ativar'}
                    </button>
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
