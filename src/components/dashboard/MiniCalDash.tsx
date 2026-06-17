'use client';

import { useState } from 'react';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA = ['S','T','Q','Q','S','S','D'];

interface Props {
  diasComEvento?: string[]; // 'YYYY-MM-DD'
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
    <div className="card" style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button
          onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}
          style={{
            width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)',
            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#6B6B66', fontSize: 14,
          }}
        >‹</button>
        <span style={{ fontSize: 13, fontFamily: 'var(--font-cormorant)', fontWeight: 600, color: '#1C1C1C' }}>
          {MESES[mes.getMonth()]} {mes.getFullYear()}
        </span>
        <button
          onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}
          style={{
            width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)',
            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#6B6B66', fontSize: 14,
          }}
        >›</button>
      </div>

      {/* Dias da semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
        {DIAS_SEMANA.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 9, fontFamily: 'var(--font-montserrat)', fontWeight: 700, color: '#9B9BA0' }}>{d}</div>
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
                background: isHoje ? '#1F7A4D' : 'transparent',
                color: isHoje ? '#FFFFFF' : '#4A4A4A',
                fontSize: 11,
                fontWeight: isHoje ? 700 : 400,
                fontFamily: 'var(--font-montserrat)',
                cursor: 'pointer',
              }}>
                {d.getDate()}
              </div>
              {temEvento && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#1F7A4D', marginTop: -2 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
