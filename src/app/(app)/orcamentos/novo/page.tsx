'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NovoOrcamentoPage() {
  const router = useRouter();
  const [pacienteSearch, setPacienteSearch] = useState('');
  const [pacientes, setPacientes] = useState<{ id: string; nome: string; cpf: string | null }[]>([]);
  const [selected, setSelected] = useState<{ id: string; nome: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const buscarPacientes = async (q: string) => {
    if (q.length < 2) { setPacientes([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/pacientes?q=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      setPacientes(data.pacientes ?? data ?? []);
    } finally {
      setLoading(false);
    }
  };

  const criar = async () => {
    if (!selected) return;
    setCreating(true);
    try {
      const res = await fetch('/api/orcamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paciente_id: selected.id }),
      });
      const data = await res.json();
      if (res.ok) router.push(`/orcamentos/${data.id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="mb-8">
        <h1 className="heading text-3xl text-offwhite mb-1" style={{ fontFamily: 'var(--font-cormorant)' }}>
          Novo Orçamento
        </h1>
        <p className="text-muted text-sm">Selecione o paciente para iniciar</p>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <label className="text-muted block mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Paciente
        </label>

        {selected ? (
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(184,154,90,0.08)', border: '1px solid rgba(184,154,90,0.25)' }}>
            <span className="text-offwhite" style={{ fontFamily: 'var(--font-montserrat)' }}>{selected.nome}</span>
            <button onClick={() => { setSelected(null); setPacienteSearch(''); }} className="text-muted hover:text-offwhite transition-colors" style={{ fontSize: 18 }}>×</button>
          </div>
        ) : (
          <div className="relative">
            <input
              className="input-field w-full"
              placeholder="Buscar paciente por nome ou CPF..."
              value={pacienteSearch}
              onChange={e => { setPacienteSearch(e.target.value); buscarPacientes(e.target.value); }}
            />
            {(pacientes.length > 0 || loading) && (
              <div className="card-elevated absolute z-10 w-full mt-1" style={{ maxHeight: 240, overflowY: 'auto' }}>
                {loading && <div className="text-muted text-center py-3 text-sm">Buscando...</div>}
                {pacientes.map(p => (
                  <div
                    key={p.id}
                    className="table-row-hover px-4 py-2.5 cursor-pointer"
                    onClick={() => { setSelected(p); setPacientes([]); }}
                  >
                    <div className="text-offwhite text-sm">{p.nome}</div>
                    {p.cpf && <div className="text-muted" style={{ fontSize: 11 }}>CPF {p.cpf}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => router.back()}
            className="btn-ghost text-sm flex-1"
          >
            Cancelar
          </button>
          <button
            onClick={criar}
            disabled={!selected || creating}
            className="btn-primary text-sm flex-1"
          >
            {creating ? 'Criando...' : 'Criar Orçamento'}
          </button>
        </div>
      </div>
    </div>
  );
}
