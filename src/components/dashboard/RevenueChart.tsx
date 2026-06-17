"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { mes: "Jul", receita: 38400, despesa: 18200 },
  { mes: "Ago", receita: 42100, despesa: 19800 },
  { mes: "Set", receita: 39800, despesa: 17400 },
  { mes: "Out", receita: 51200, despesa: 22300 },
  { mes: "Nov", receita: 47600, despesa: 20100 },
  { mes: "Dez", receita: 55900, despesa: 24700 },
  { mes: "Jan", receita: 44300, despesa: 19200 },
  { mes: "Fev", receita: 49700, despesa: 21500 },
  { mes: "Mar", receita: 52100, despesa: 23400 },
  { mes: "Abr", receita: 46800, despesa: 20800 },
  { mes: "Mai", receita: 53400, despesa: 22100 },
  { mes: "Jun", receita: 48700, despesa: 21300 },
];

function formatBRL(value: number) {
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
  return `R$ ${value}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="card-elevated p-3"
      style={{ border: "1px solid rgba(0,0,0,0.08)", minWidth: 140 }}
    >
      <div className="text-text-secondary text-xs mb-2">{label}</div>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 text-xs">
          <span style={{ color: p.color }}>{p.name === "receita" ? "Receita" : "Despesa"}</span>
          <span className="text-text-primary font-semibold">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RevenueChart() {
  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-text-primary font-semibold text-sm">Faturamento 12 Meses</h2>
          <p className="text-text-secondary text-xs mt-0.5">jul/25 — jun/26</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full" style={{ background: "#59399E" }} />
            <span className="text-text-secondary text-xs">Receita</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full bg-error" />
            <span className="text-text-secondary text-xs">Despesa</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#59399E" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#59399E" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradDespesa" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#DC2626" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fill: "#9B9BA0", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatBRL}
            tick={{ fill: "#9B9BA0", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="receita"
            stroke="#59399E"
            strokeWidth={2}
            fill="url(#gradReceita)"
            dot={false}
            activeDot={{ r: 4, fill: "#59399E" }}
          />
          <Area
            type="monotone"
            dataKey="despesa"
            stroke="#DC2626"
            strokeWidth={1.5}
            fill="url(#gradDespesa)"
            dot={false}
            activeDot={{ r: 4, fill: "#DC2626" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
