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
  background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#F5F2EA', fontSize: '0.75rem',
};

function KPI({ label, valor, sub, cor }: { label: string; valor: string; sub?: string; cor?: string }) {
  return (
    <div className="card p-5">
      <p className="table-header mb-1">{label}</p>
      <p className="font-semibold" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.6rem', color: cor ?? '#F5F2EA' }}>{valor}</p>
      {sub && <p className="text-muted mt-0.5" style={{ fontSize: '0.68rem' }}>{sub}</p>}
    </div>
  );
}

export function RelatoriosClient({ fluxo, pacientesPorMes, consultasPorStatus, totalPacientes, totalRecebidoAno, totalPagoAno, inadimplencia }: Props) {
  const saldoAno = totalRecebidoAno - totalPagoAno;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Total de Pacientes" valor={String(totalPacientes)} />
        <KPI label="Recebido no Ano" valor={totalRecebidoAno.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} cor="#4ADE80" />
        <KPI label="Pago no Ano" valor={totalPagoAno.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} cor="#F87171" />
        <KPI label="Saldo do Ano" valor={saldoAno.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} cor={saldoAno >= 0 ? '#4ADE80' : '#F87171'}
          sub={inadimplencia > 0 ? `Inadimplência: ${inadimplencia.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}` : undefined} />
      </div>

      {/* Fluxo de caixa */}
      <div className="card p-5">
        <h2 className="heading text-offwhite mb-4" style={{ fontSize: '1.1rem' }}>Fluxo de Caixa — Últimos 6 Meses</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={fluxo} barGap={4} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="mes" tick={{ fill: '#8A8A93', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8A8A93', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} />
            <Legend wrapperStyle={{ fontSize: '0.72rem', color: '#8A8A93' }} />
            <Bar dataKey="recebido" name="Recebido" fill="#4ADE80" radius={[4,4,0,0]} />
            <Bar dataKey="pago" name="Pago" fill="#F87171" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Novos pacientes por mês */}
        <div className="card p-5">
          <h2 className="heading text-offwhite mb-4" style={{ fontSize: '1.1rem' }}>Novos Pacientes</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={pacientesPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill: '#8A8A93', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8A8A93', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
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
                <Legend wrapperStyle={{ fontSize: '0.7rem', color: '#8A8A93' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
