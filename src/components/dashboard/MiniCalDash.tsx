'use client';

import { useState } from 'react';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

interface Props {
  diasComEvento?: string[]; // array de 'YYYY-MM-DD'
}

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }

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
    <div style={{
      borderRadius: 14,
      background: 'linear-gradient(145deg, #141416 0%, #111113 100%)',
      border: '1px solid rgba(255,255,255,0.07)',
      padding: '16px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8A93', fontSize: 16, lineHeight: 1, padding: '2px 6px' }}
        >‹</button>
        <span style={{ fontSize: 12, fontFamily: 'var(--font-montserrat)', fontWeight: 700, color: '#F5F2EA' }}>
          {MESES[mes.getMonth()]} {mes.getFullYear()}
        </span>
        <button
          onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8A93', fontSize: 16, lineHeight: 1, padding: '2px 6px' }}
        >›</button>
      </div>

      {/* Dias da semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {['S','T','Q','Q','S','S','D'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 9, fontFamily: 'var(--font-montserrat)', fontWeight: 700, color: '#8A8A93' }}>{d}</div>
        ))}
      </div>

      {/* Células */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 2 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = isoDate(d);
          const isHoje = iso === hoje;
          const temEvento = evSet.has(iso);
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isHoje ? '#B89A5A' : 'transparent',
                color: isHoje ? '#0A0A0B' : '#8A8A93',
                fontSize: 11, fontWeight: isHoje ? 700 : 400,
                fontFamily: 'var(--font-montserrat)',
                cursor: 'pointer',
              }}>
                {d.getDate()}
              </div>
              {temEvento && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#B89A5A', marginTop: -2 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
