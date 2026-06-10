'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export interface FluxoMes {
  mes: string;
  recebido: number;
  pago: number;
}

export function FluxoCaixaChart({ data }: { data: FluxoMes[] }) {
  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fill: '#8A8A93', fontSize: 11, fontFamily: 'Montserrat' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.07)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#8A8A93', fontSize: 10, fontFamily: 'Montserrat' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            contentStyle={{
              background: '#1A1A1E',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              fontFamily: 'Montserrat',
              fontSize: 12,
            }}
            labelStyle={{ color: '#F5F2EA' }}
            formatter={(value: number | string | Array<number | string>, name: string) => [
              Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
              name === 'recebido' ? 'Recebido' : 'Pago',
            ]}
          />
          <Legend
            formatter={(v: string) => (
              <span style={{ color: '#8A8A93', fontSize: 11, fontFamily: 'Montserrat' }}>
                {v === 'recebido' ? 'Recebido' : 'Pago'}
              </span>
            )}
          />
          <Bar dataKey="recebido" fill="#B89A5A" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="pago" fill="#F87171" radius={[4, 4, 0, 0]} maxBarSize={32} opacity={0.7} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
