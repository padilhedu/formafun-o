'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { dataBRT, hojeBRT } from '@/lib/datas';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const DOW   = ['S','T','Q','Q','S','S','D'];

interface MiniCalendarProps {
  diasComEvento?: string[]; // 'YYYY-MM-DD' em BRT
}

export function MiniCalendar({ diasComEvento = [] }: MiniCalendarProps) {
  const hoje = hojeBRT();
  const [mes, setMes] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const diasNoMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const dow0 = new Date(mes.getFullYear(), mes.getMonth(), 1).getDay();
  const offset = dow0 === 0 ? 6 : dow0 - 1; // segunda = 0

  const cells: (Date | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= diasNoMes; d++) {
    cells.push(new Date(mes.getFullYear(), mes.getMonth(), d));
  }

  const evSet = new Set(diasComEvento);

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      {/* Header mês/ano */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}
          style={{
            width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.08)',
            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6B6B66',
          }}
          aria-label="Mês anterior"
        >
          <ChevronLeft size={12} />
        </button>
        <span style={{ fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 600, color: '#1C1C1C' }}>
          {MESES[mes.getMonth()]} {mes.getFullYear()}
        </span>
        <button
          onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}
          style={{
            width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.08)',
            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6B6B66',
          }}
          aria-label="Próximo mês"
        >
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Cabeçalho dias da semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {DOW.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 9, fontFamily: 'var(--font-body)', fontWeight: 700, color: '#6B6B66' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Células */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 2 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = dataBRT(d);
          const isHoje = iso === hoje;
          const temEvento = evSet.has(iso);

          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isHoje ? '#1F7A4D' : 'transparent',
                color: isHoje ? '#FFFFFF' : '#1C1C1C',
                fontSize: 11, fontWeight: isHoje ? 700 : 400,
                fontFamily: 'var(--font-body)',
              }}>
                {d.getDate()}
              </div>
              {temEvento && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#1F7A4D', marginTop: -4 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
