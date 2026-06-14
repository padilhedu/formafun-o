import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { UpcomingAppointments } from "@/components/dashboard/UpcomingAppointments";
import { RecentPatients } from "@/components/dashboard/RecentPatients";

// Icons inline para evitar dependência de pacote
function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="11" rx="2" />
      <path d="M2 7h12M5 2v2M11 2v2" strokeLinecap="round" />
    </svg>
  );
}
function IconTrending() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 12l4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 5h3v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconFile() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 2v4h4M5 9h6M5 12h4" strokeLinecap="round" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="5" r="2.5" />
      <path d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5" strokeLinecap="round" />
      <path d="M11 3c1.1 0 2 .9 2 2s-.9 2-2 2M15 13c0-1.9-1.3-3.5-3-4" strokeLinecap="round" />
    </svg>
  );
}

const STATUS_BG: Record<string, string> = {
  Aprovado: "rgba(74,222,128,0.1)",
  Pendente: "rgba(251,191,36,0.1)",
  Rascunho: "rgba(138,138,147,0.08)",
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

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#B89A5A", fontFamily: "var(--font-montserrat)" }}>
            Forma &amp; Função · Balneário Camboriú
          </p>
          <h1
            className="text-4xl font-semibold leading-none"
            style={{ fontFamily: "var(--font-cormorant)", color: "#F5F2EA", letterSpacing: "-0.02em" }}
          >
            Visão Geral
          </h1>
          <p className="text-sm mt-2" style={{ color: "#8A8A93" }}>
            Segunda-feira, 9 de junho de 2026
          </p>
        </div>
        {/* Quick action pill */}
        <a
          href="/agenda"
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150"
          style={{
            background: "rgba(184,154,90,0.1)",
            color: "#B89A5A",
            border: "1px solid rgba(184,154,90,0.25)",
            fontFamily: "var(--font-montserrat)",
          }}
        >
          <IconCalendar />
          Abrir Agenda
        </a>
      </div>

      {/* KPI Bento Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Consultas Hoje"
          value="8"
          sub="3 confirmadas · 2 a confirmar"
          trend="+2 vs ontem"
          trendUp
          color="gold"
          icon={<IconCalendar />}
        />
        <KpiCard
          title="Faturamento do Mês"
          value="R$ 48.700"
          sub="Meta: R$ 60.000"
          trend="+12% vs jun/25"
          trendUp
          color="success"
          icon={<IconTrending />}
          progress={81}
          progressLabel="81% da meta atingida"
        />
        <KpiCard
          title="Orçamentos Pendentes"
          value="14"
          sub="R$ 32.450 em aberto"
          trend="5 vencem em 7 dias"
          trendUp={false}
          color="warning"
          icon={<IconFile />}
        />
        <KpiCard
          title="Pacientes Ativos"
          value="347"
          sub="28 novos este mês"
          trend="+8% vs mai/26"
          trendUp
          color="info"
          icon={<IconUsers />}
        />
      </div>

      {/* Gráfico + Agenda — 2/3 + 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <UpcomingAppointments />
        </div>
      </div>

      {/* Bottom row: pacientes recentes + orçamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentPatients />

        {/* Orçamentos Recentes */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "linear-gradient(145deg, #141416 0%, #111113 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2
                className="text-sm font-semibold"
                style={{ color: "#F5F2EA", fontFamily: "var(--font-montserrat)" }}
              >
                Orçamentos Recentes
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "#8A8A93" }}>Últimos 7 dias</p>
            </div>
            <a
              href="/orcamentos"
              className="text-xs font-semibold transition-colors duration-150 hover:opacity-80"
              style={{ color: "#B89A5A", fontFamily: "var(--font-montserrat)" }}
            >
              Ver todos →
            </a>
          </div>

          <div className="space-y-0">
            {MOCK_BUDGETS.map((b, i) => (
              <div
                key={b.id}
                className="flex items-center justify-between py-3 transition-colors duration-150 hover:bg-white/[0.025] rounded-lg px-2 -mx-2 cursor-pointer"
                style={{
                  borderBottom: i < MOCK_BUDGETS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                <div className="min-w-0 flex-1">
                  <div
                    className="text-sm font-medium truncate"
                    style={{ color: "#F5F2EA", fontFamily: "var(--font-montserrat)" }}
                  >
                    {b.patient}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#8A8A93" }}>
                    {b.code} · {b.date}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: "#F5F2EA", fontFamily: "var(--font-montserrat)" }}
                  >
                    {b.value}
                  </span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: STATUS_BG[b.status],
                      color: STATUS_COLOR[b.status],
                      border: `1px solid ${STATUS_BORDER[b.status]}`,
                      fontFamily: "var(--font-montserrat)",
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
