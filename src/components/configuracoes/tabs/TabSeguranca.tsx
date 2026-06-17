'use client';

import { useState } from 'react';
import type { AuditRow } from '../ConfiguracoesClient';

interface Props { auditLog: AuditRow[]; }

export function TabSeguranca({ auditLog }: Props) {
  const [filtroAcao, setFiltroAcao] = useState('');
  const [filtroTabela, setFiltroTabela] = useState('');

  const acoes = [...new Set(auditLog.map(r => r.acao))];
  const tabelas = [...new Set(auditLog.map(r => r.tabela).filter(Boolean))] as string[];

  const visivel = auditLog.filter(r => {
    if (filtroAcao && r.acao !== filtroAcao) return false;
    if (filtroTabela && r.tabela !== filtroTabela) return false;
    return true;
  });

  function exportCSV() {
    const header = 'Data,Usuário,Ação,Tabela,Registro\n';
    const rows = visivel.map(r =>
      `${new Date(r.criado_em).toLocaleString('pt-BR')},${r.usuario_email ?? ''},${r.acao},${r.tabela ?? ''},${r.registro_id ?? ''}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'audit_log.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <h2 className="heading text-offwhite" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem' }}>Segurança e Auditoria</h2>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Registros no audit log', value: auditLog.length, color: '#1F7A4D' },
          { label: 'Ações distintas', value: acoes.length, color: '#60A5FA' },
          { label: 'Tabelas monitoradas', value: tabelas.length, color: '#1F7A4D' },
        ].map(k => (
          <div key={k.label} className="card p-4" style={{ borderLeft: `3px solid ${k.color}` }}>
            <p className="table-header mb-1">{k.label}</p>
            <p className="heading text-2xl font-semibold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Audit log viewer */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <p className="table-header" style={{ color: '#1F7A4D' }}>AUDIT LOG</p>
          <div style={{ flex: 1 }} />
          <select className="input-field" style={{ maxWidth: 150, fontSize: 11 }} value={filtroAcao} onChange={e => setFiltroAcao(e.target.value)}>
            <option value="">Todas ações</option>
            {acoes.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="input-field" style={{ maxWidth: 150, fontSize: 11 }} value={filtroTabela} onChange={e => setFiltroTabela(e.target.value)}>
            <option value="">Todas tabelas</option>
            {tabelas.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={exportCSV} className="btn-ghost" style={{ padding: '5px 12px', fontSize: 11 }}>↓ CSV</button>
        </div>

        <div style={{ overflow: 'auto', maxHeight: 400 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
            <thead style={{ position: 'sticky', top: 0, background: '#FFFFFF' }}>
              <tr>
                {['Data/Hora', 'Usuário', 'Ação', 'Tabela', 'Registro'].map(h => (
                  <th key={h} className="table-header" style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visivel.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted py-8 text-sm">Nenhum registro.</td></tr>
              )}
              {visivel.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <td style={{ padding: '8px 12px' }}>
                    <span className="text-muted text-xs">{new Date(r.criado_em).toLocaleString('pt-BR')}</span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span className="text-offwhite text-xs">{r.usuario_email ?? '—'}</span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span className="badge" style={{ fontSize: 9, background: 'rgba(31,122,77,0.1)', color: '#1F7A4D', border: '1px solid rgba(31,122,77,0.2)' }}>
                      {r.acao}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span className="text-muted text-xs">{r.tabela ?? '—'}</span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span className="text-muted text-xs">{r.registro_id ? r.registro_id.slice(0, 8) + '…' : '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
