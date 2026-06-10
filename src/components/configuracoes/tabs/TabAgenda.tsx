'use client';

import { useState } from 'react';

interface AgendaConfig {
  inicio?: string; fim?: string; slot_minutos?: number;
  almoco_inicio?: string; almoco_fim?: string; antecedencia_min_horas?: number;
}

interface Props { config: Record<string, unknown>; }

export function TabAgenda({ config }: Props) {
  const initial = (config['agenda'] as AgendaConfig) ?? {};
  const [form, setForm] = useState<AgendaConfig>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof AgendaConfig>(k: K, v: AgendaConfig[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function handleSave() {
    setSaving(true);
    await fetch('/api/configuracoes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chave: 'agenda', valor: form }),
    });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="heading text-offwhite" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem' }}>Configurações de Agenda</h2>
        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '6px 20px', fontSize: 12 }}>
          {saving ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar'}
        </button>
      </div>

      <div className="card p-5 space-y-4">
        <p className="table-header" style={{ color: '#B89A5A', marginBottom: 8 }}>HORÁRIO DE FUNCIONAMENTO</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="table-header block mb-1">Abertura</label>
            <input type="time" className="input-field" value={form.inicio ?? '08:00'} onChange={e => set('inicio', e.target.value)} />
          </div>
          <div>
            <label className="table-header block mb-1">Fechamento</label>
            <input type="time" className="input-field" value={form.fim ?? '18:00'} onChange={e => set('fim', e.target.value)} />
          </div>
          <div>
            <label className="table-header block mb-1">Início Almoço</label>
            <input type="time" className="input-field" value={form.almoco_inicio ?? '12:00'} onChange={e => set('almoco_inicio', e.target.value)} />
          </div>
          <div>
            <label className="table-header block mb-1">Fim Almoço</label>
            <input type="time" className="input-field" value={form.almoco_fim ?? '13:00'} onChange={e => set('almoco_fim', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <p className="table-header" style={{ color: '#B89A5A', marginBottom: 8 }}>AGENDAMENTO</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="table-header block mb-1">Duração do slot (minutos)</label>
            <select className="input-field" value={form.slot_minutos ?? 30} onChange={e => set('slot_minutos', Number(e.target.value))}>
              {[15, 20, 30, 45, 60].map(v => <option key={v} value={v}>{v} min</option>)}
            </select>
          </div>
          <div>
            <label className="table-header block mb-1">Antecedência mínima (horas)</label>
            <input type="number" min="0" max="72" className="input-field" value={form.antecedencia_min_horas ?? 2} onChange={e => set('antecedencia_min_horas', Number(e.target.value))} />
          </div>
        </div>
      </div>
    </div>
  );
}
