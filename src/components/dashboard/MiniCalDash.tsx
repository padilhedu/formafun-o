'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface Props {
  diasComEvento?: string[]; // array de 'YYYY-MM-DD'
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function MiniCalDash({ diasComEvento = [] }: Props) {
  const hoje = isoDate(new Date());
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const diasNoMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const primeiroDow = new Date(mes.getFullYear(), mes.getMonth(), 1).getDay();
  const offset = primeiroDow === 0 ? 6 : primeiroDow - 1;

  const cells: (Date | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= diasNoMes; d++) {
    cells.push(new Date(mes.getFullYear(), mes.getMonth(), d));
  }

  const evSet = new Set(diasComEvento);

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}
          className="p-1 rounded hover:bg-bg-muted transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-bold tracking-widest" style={{ color: 'var(--color-text-primary)' }}>
          {MESES[mes.getMonth()].toUpperCase()} {mes.getFullYear()}
        </span>
        <button
          onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}
          className="p-1 rounded hover:bg-bg-muted transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Células */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d)
            return (
              <div key={i} className="h-7" />
            );
          const iso = isoDate(d);
          const isHoje = iso === hoje;
          const temEvento = evSet.has(iso);
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer transition-colors"
                style={{
                  background: isHoje ? 'var(--color-accent)' : 'transparent',
                  color: isHoje ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
                  fontWeight: isHoje ? 700 : 400,
                }}
              >
                {d.getDate()}
              </div>
              {temEvento && (
                <div
                  className="w-1 h-1 rounded-full -mt-0.5"
                  style={{ background: 'var(--color-accent)' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
