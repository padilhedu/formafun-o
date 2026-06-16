import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { UpcomingAppointments } from "@/components/dashboard/UpcomingAppointments";
import { RecentPatients } from "@/components/dashboard/RecentPatients";

export default function DashboardPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="heading text-3xl text-offwhite mb-1"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          Dashboard
        </h1>
        <p className="text-muted text-sm">
          Segunda-feira, 9 de junho de 2026 · Forma & Função
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Consultas Hoje"
          value="8"
          sub="3 confirmadas · 2 a confirmar"
          trend="+2 vs ontem"
          trendUp
          color="gold"
        />
        <KpiCard
          title="Faturamento do Mês"
          value="R$ 48.700"
          sub="Meta: R$ 60.000"
          trend="+12% vs jun/25"
          trendUp
          color="success"
        />
        <KpiCard
          title="Orçamentos Pendentes"
          value="14"
          sub="R$ 32.450 em aberto"
          trend="5 vencendo em 7 dias"
          trendUp={false}
          color="warning"
        />
        <KpiCard
          title="Pacientes Ativos"
          value="347"
          sub="28 novos este mês"
          trend="+8% vs mai/26"
          trendUp
          color="info"
        />
      </div>

      {/* Gráfico + Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <UpcomingAppointments />
        </div>
      </div>

      {/* Pacientes recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentPatients />
        <div className="card p-5">
          <h2 className="font-semibold text-sm mb-4" style={{ color: "#1A1A1A" }}>
            Orçamentos Recentes
          </h2>
          <div className="space-y-3">
            {MOCK_BUDGETS.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between py-2.5 table-row-hover"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div>
                  <div className="text-offwhite text-xs font-medium">{b.patient}</div>
                  <div className="text-muted text-xs mt-0.5">{b.code} · {b.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-offwhite text-sm font-semibold">{b.value}</span>
                  <span
                    className="badge"
                    style={{
                      background: STATUS_BG[b.status],
                      color: STATUS_COLOR[b.status],
                      border: `1px solid ${STATUS_BORDER[b.status]}`,
                    }}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_BG: Record<string, string> = {
  Aprovado: "rgba(74,222,128,0.1)",
  Pendente: "rgba(251,191,36,0.1)",
  Rascunho: "rgba(138,138,147,0.1)",
  Recusado: "rgba(248,113,113,0.1)",
};
const STATUS_COLOR: Record<string, string> = {
  Aprovado: "#4ADE80",
  Pendente: "#FBBF24",
  Rascunho: "#8A8A93",
  Recusado: "#F87171",
};
const STATUS_BORDER: Record<string, string> = {
  Aprovado: "rgba(74,222,128,0.25)",
  Pendente: "rgba(251,191,36,0.25)",
  Rascunho: "rgba(138,138,147,0.15)",
  Recusado: "rgba(248,113,113,0.25)",
};

const MOCK_BUDGETS = [
  { id: 1, code: "ORC-2026-00041", patient: "Ana Paula Ferreira", value: "R$ 4.800", status: "Aprovado", date: "07/06" },
  { id: 2, code: "ORC-2026-00040", patient: "Marcos Silveira", value: "R$ 12.300", status: "Pendente", date: "06/06" },
  { id: 3, code: "ORC-2026-00039", patient: "Cláudia Mendes", value: "R$ 2.150", status: "Pendente", date: "05/06" },
  { id: 4, code: "ORC-2026-00038", patient: "Roberto Alves", value: "R$ 8.900", status: "Rascunho", date: "04/06" },
  { id: 5, code: "ORC-2026-00037", patient: "Fernanda Costa", value: "R$ 6.400", status: "Recusado", date: "03/06" },
];
