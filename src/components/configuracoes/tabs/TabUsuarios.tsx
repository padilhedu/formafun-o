'use client';

import { useState } from 'react';
import type { UsuarioRow } from '../ConfiguracoesClient';

interface Props { usuarios: UsuarioRow[]; }

export function TabUsuarios({ usuarios }: Props) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'recepcao'>('recepcao');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleConvidar(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true); setMsg('');
    // Supabase invite user — calls admin API server-side
    const res = await fetch('/api/admin/convidar-usuario', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    setLoading(false);
    if (res.ok) { setMsg(`Convite enviado para ${email}`); setEmail(''); }
    else { const d = await res.json(); setMsg(`Erro: ${d.error}`); }
  }

  const roleLabel = (r: string) => r === 'admin' ? 'Administrador' : 'Recepção';
  const roleBadge = (r: string) => r === 'admin'
    ? { bg: 'rgba(31,122,77,0.1)', color: '#1F7A4D', border: 'rgba(31,122,77,0.3)' }
    : { bg: 'rgba(96,165,250,0.1)', color: '#60A5FA', border: 'rgba(96,165,250,0.3)' };

  return (
    <div className="space-y-4">
      <h2 className="heading text-offwhite" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem' }}>Usuários e Permissões</h2>

      {/* Invite form */}
      <div className="card p-5">
        <p className="table-header mb-3" style={{ color: '#1F7A4D' }}>CONVIDAR USUÁRIO</p>
        <form onSubmit={handleConvidar} className="flex flex-wrap gap-3 items-end">
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="table-header block mb-1">E-mail</label>
            <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@exemplo.com" required />
          </div>
          <div>
            <label className="table-header block mb-1">Papel</label>
            <select className="input-field" value={role} onChange={e => setRole(e.target.value as 'admin' | 'recepcao')}>
              <option value="recepcao">Recepção</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '8px 20px', fontSize: 12 }}>
            {loading ? 'Enviando...' : 'Enviar Convite'}
          </button>
        </form>
        {msg && <p className="text-sm mt-2" style={{ color: msg.startsWith('Erro') ? '#C0392B' : '#1F7A4D' }}>{msg}</p>}
      </div>

      {/* Users list */}
      <div className="card" style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Usuário', 'Papel', 'Último Acesso', ''].map(h => (
                <th key={h} className="table-header" style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 && (
              <tr><td colSpan={4} className="text-center text-muted py-10 text-sm">Nenhum usuário encontrado.</td></tr>
            )}
            {usuarios.map(u => {
              const badge = roleBadge(u.role);
              return (
                <tr key={u.id} className="table-row-hover" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="text-offwhite text-sm">{u.nome ?? u.id}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge" style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, fontSize: 10 }}>
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="text-muted text-xs">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <span className="text-muted text-xs">—</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card p-4" style={{ background: 'rgba(248,113,113,0.04)', borderColor: 'rgba(248,113,113,0.15)' }}>
        <p className="text-muted text-xs">Papéis disponíveis: <strong style={{ color: '#1F7A4D' }}>Administrador</strong> (acesso total, incluindo configurações) · <strong style={{ color: '#60A5FA' }}>Recepção</strong> (pacientes, agenda, financeiro — sem configurações ou audit log).</p>
      </div>
    </div>
  );
}
