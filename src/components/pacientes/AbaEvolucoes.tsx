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
        <div className="card p-5 mb-5">
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
                    background: ev.travada ? '#1A1A1E' : '#4ADE80',
                    borderColor: ev.travada ? '#8A8A93' : '#4ADE80',
                  }} />
                <div className="card p-4">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-offwhite text-sm font-semibold">{ev.procedimento}</span>
                      {ev.dente && (
                        <span className="badge" style={{ background: 'rgba(96,165,250,0.1)', color: '#60A5FA', border: '1px solid rgba(96,165,250,0.2)' }}>
                          Dente {ev.dente}
                        </span>
                      )}
                      {ev.travada && (
                        <span className="badge" style={{ background: 'rgba(74,222,128,0.08)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.2)' }}>
                          ✓ Travado
                        </span>
                      )}
                    </div>
                    <span className="text-muted text-xs flex-shrink-0">{formatDate(ev.data)}</span>
                  </div>
                  {ev.descricao && <p className="text-muted text-sm mt-1 leading-relaxed">{ev.descricao}</p>}
                  {ev.travada && (
                    <p className="text-muted text-xs mt-2 italic" style={{ color: '#4ADE80', opacity: 0.7 }}>
                      Registro travado — imutável conforme normas do CFO
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
