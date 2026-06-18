'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/masks';
import type { Evolucao } from '@/types/pacientes';

interface Props { pacienteId: string; evolucoes: Evolucao[]; }

export function AbaEvolucoes({ pacienteId, evolucoes: iniciais }: Props) {
  const [evolucoes, setEvolucoes] = useState<Evolucao[]>(iniciais);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ procedimento: '', dente: '', descricao: '' });

  async function handleAdd() {
    if (!form.procedimento.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/pacientes/${pacienteId}/evolucoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const nova = await res.json();
      setEvolucoes(evs => [nova, ...evs]);
      setForm({ procedimento: '', dente: '', descricao: '' });
      setShowForm(false);
    }
    setSaving(false);
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-offwhite font-semibold text-sm">Evoluções Clínicas</h3>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Cancelar' : '+ Nova Evolução'}
        </button>
      </div>

      {/* Formulário nova evolução */}
      {showForm && (
        <div style={{ borderRadius: 14, background: 'linear-gradient(145deg, #141416 0%, #111113 100%)', border: '1px solid rgba(31,122,77,0.2)', padding: '20px', marginBottom: 20 }}>
          <h4 className="text-offwhite text-sm font-semibold mb-4">Registrar Evolução</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-muted text-xs uppercase tracking-wide mb-1.5">Procedimento *</label>
                <input className="input-field" value={form.procedimento}
                  onChange={e => setForm(f => ({ ...f, procedimento: e.target.value }))}
                  placeholder="Ex: Restauração classe II" />
              </div>
              <div>
                <label className="block text-muted text-xs uppercase tracking-wide mb-1.5">Dente (FDI)</label>
                <input className="input-field" value={form.dente}
                  onChange={e => setForm(f => ({ ...f, dente: e.target.value }))}
                  placeholder="Ex: 36, 11..." />
              </div>
            </div>
            <div>
              <label className="block text-muted text-xs uppercase tracking-wide mb-1.5">Descrição / Observações</label>
              <textarea className="input-field" rows={3} value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Descreva o atendimento, materiais utilizados, intercorrências..." />
            </div>
            <button className="btn-primary" onClick={handleAdd} disabled={saving || !form.procedimento.trim()}>
              {saving ? 'Salvando...' : 'Salvar Evolução'}
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {evolucoes.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-muted text-sm">Nenhuma evolução registrada ainda.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="space-y-3 pl-12">
            {evolucoes.map(ev => (
              <div key={ev.id} className="relative">
                <div className="absolute -left-7 top-4 w-2.5 h-2.5 rounded-full border-2 flex-shrink-0"
                  style={{
                    background: ev.travada ? '#FFFFFF' : '#4ADE80',
                    borderColor: ev.travada ? '#6B6B66' : '#4ADE80',
                  }} />
                <div style={{
                  borderRadius: 12,
                  background: 'linear-gradient(145deg, #141416 0%, #111113 100%)',
                  border: `1px solid ${ev.travada ? 'rgba(255,255,255,0.06)' : 'rgba(74,222,128,0.12)'}`,
                  padding: '16px',
                }}>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: 13, fontWeight: 600, color: '#1C1C1C' }}>{ev.procedimento}</span>
                      {ev.dente && (
                        <span className="badge" style={{ background: 'rgba(96,165,250,0.1)', color: '#60A5FA', border: '1px solid rgba(96,165,250,0.2)', fontSize: 10 }}>
                          Dente {ev.dente}
                        </span>
                      )}
                      {ev.travada && (
                        <span className="badge" style={{ background: 'rgba(74,222,128,0.08)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.2)', fontSize: 10 }}>
                          ✓ CFO
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: '#6B6B66', flexShrink: 0, fontFamily: 'var(--font-montserrat)', fontVariantNumeric: 'tabular-nums' }}>{formatDate(ev.data)}</span>
                  </div>
                  {ev.descricao && <p style={{ color: '#6B6B66', fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>{ev.descricao}</p>}
                  {ev.travada && (
                    <p style={{ fontSize: 11, marginTop: 8, color: '#4ADE80', opacity: 0.6, fontStyle: 'italic' }}>
                      Registro imutável · CFO
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
