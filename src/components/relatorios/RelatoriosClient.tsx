'use client';

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';

interface MesData { mes: string; recebido: number; pago: number; saldo: number; }
interface StatusData { name: string; value: number; color: string; }

interface Props {
  fluxo: MesData[];
  pacientesPorMes: { mes: string; novos: number }[];
  consultasPorStatus: StatusData[];
  totalPacientes: number;
  totalRecebidoAno: number;
  totalPagoAno: number;
  inadimplencia: number;
}

const TOOLTIP_STYLE = {
  background: '#FAF8F4', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#1C1C1C', fontSize: '0.75rem',
};

function KPI({ label, valor, sub, cor, accent }: { label: string; valor: string; sub?: string; cor?: string; accent?: string }) {
  return (
    <div className="card p-5" style={{ borderLeft: `3px solid ${accent ?? cor ?? '#1F7A4D'}` }}>
      <p className="table-header mb-2">{label}</p>
      <p className="heading text-3xl font-semibold" style={{ color: cor ?? '#1C1C1C' }}>{valor}</p>
      {sub && <p className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>{sub}</p>}
    </div>
  );
}

export function RelatoriosClient({ fluxo, pacientesPorMes, consultasPorStatus, totalPacientes, totalRecebidoAno, totalPagoAno, inadimplencia }: Props) {
  const saldoAno = totalRecebidoAno - totalPagoAno;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Total de Pacientes" valor={String(totalPacientes)} accent="#1F7A4D" />
        <KPI label="Recebido no Ano" valor={totalRecebidoAno.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} cor="#1F7A4D" accent="#1F7A4D" />
        <KPI label="Pago no Ano" valor={totalPagoAno.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} cor="#C0392B" accent="#C0392B" />
        <KPI label="Saldo do Ano" valor={saldoAno.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} cor={saldoAno >= 0 ? '#1F7A4D' : '#C0392B'} accent={saldoAno >= 0 ? '#1F7A4D' : '#C0392B'}
          sub={inadimplencia > 0 ? `Inadimplência: ${inadimplencia.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}` : undefined} />
      </div>

      {/* Fluxo de caixa */}
      <div className="card p-5">
        <h2 className="heading text-offwhite mb-4" style={{ fontSize: '1.1rem' }}>Fluxo de Caixa — Últimos 6 Meses</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={fluxo} barGap={4} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="mes" tick={{ fill: '#6B6B66', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6B6B66', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => Number(v ?? 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} />
            <Legend wrapperStyle={{ fontSize: '0.72rem', color: '#6B6B66' }} />
            <Bar dataKey="recebido" name="Recebido" fill="#1F7A4D" radius={[4,4,0,0]} />
            <Bar dataKey="pago" name="Pago" fill="#C0392B" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Novos pacientes por mês */}
        <div className="card p-5">
          <h2 className="heading text-offwhite mb-4" style={{ fontSize: '1.1rem' }}>Novos Pacientes</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={pacientesPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="mes" tick={{ fill: '#6B6B66', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B6B66', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="novos" name="Novos pacientes" stroke="#7B5DC0" strokeWidth={2} dot={{ fill: '#7B5DC0', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Consultas por status */}
        <div className="card p-5">
          <h2 className="heading text-offwhite mb-4" style={{ fontSize: '1.1rem' }}>Consultas por Status</h2>
          {consultasPorStatus.every(d => d.value === 0) ? (
            <div className="flex items-center justify-center h-48 text-muted text-sm">Nenhuma consulta registrada.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={consultasPorStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {consultasPorStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '0.7rem', color: '#6B6B66' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
