import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { MiniCalDash } from "@/components/dashboard/MiniCalDash";
import { CardClinica } from "@/components/dashboard/CardClinica";
import { AgendaHoje } from "@/components/dashboard/AgendaHoje";
import { RecentPatients } from "@/components/dashboard/RecentPatients";

export const dynamic = "force-dynamic";

function saudacao() {
  const h = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "numeric", hour12: false });
  const n = parseInt(h);
  if (n < 12) return "Bom dia";
  if (n < 18) return "Boa tarde";
  return "Boa noite";
}

function dataExtenso() {
  return new Date().toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isoHoje() {
  const d = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  return d;
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function DashboardPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <div className="text-muted p-8">Configure o Supabase.</div>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const hoje = isoHoje();
  const inicioMes = `${hoje.slice(0, 7)}-01`;

  const [profileRes, eventosRes, orcamentosRes, pacientesRes, profissionaisRes, configRes] = await Promise.all([
    supabase.from("profiles").select("nome, role").eq("id", user.id).single(),
    supabase
      .from("agenda_eventos")
      .select("id, titulo, inicio, fim, status, pacientes(nome)")
      .gte("inicio", `${hoje}T00:00:00`)
      .lte("inicio", `${hoje}T23:59:59`)
      .order("inicio"),
    supabase
      .from("orcamentos")
      .select("status, valor_total, criado_em")
      .gte("criado_em", `${inicioMes}T00:00:00`),
    supabase.from("pacientes").select("id", { count: "exact", head: true }).eq("ativo", true),
    supabase.from("profissionais").select("id", { count: "exact", head: true }).eq("ativo", true),
    supabase.from("configuracoes_clinica").select("nome_clinica, especialidade, cro, cidade").limit(1).maybeSingle(),
  ]);

  const profile = profileRes.data as { nome: string; role: string } | null;
  const eventos = (eventosRes.data ?? []) as unknown as {
    id: string; titulo: string; inicio: string; fim: string; status: string;
    pacientes?: { nome: string } | null;
  }[];
  const orcamentos = orcamentosRes.data ?? [];
  const totalPacientes = pacientesRes.count ?? 0;
  const totalProfissionais = profissionaisRes.count ?? 0;
  const clinica = configRes.data as { nome_clinica: string; especialidade?: string; cro?: string; cidade?: string } | null;

  // KPIs
  const faturamentoMes = orcamentos
    .filter(o => o.status === "aprovado")
    .reduce((s, o) => s + (o.valor_total ?? 0), 0);

  const orcamentosAbertos = orcamentos.filter(o => ["enviado", "negociacao"].includes(o.status)).length;
  const consultasHoje = eventos.length;
  const confirmados = eventos.filter(e => ["confirmado", "em_atendimento", "realizado"].includes(e.status)).length;

  // Dias com evento para o mini-calendário (mês atual)
  const diasComEvento: string[] = [];
  {
    const { data: eventosCalendario } = await supabase
      .from("agenda_eventos")
      .select("inicio")
      .gte("inicio", `${inicioMes}T00:00:00`);
    eventosCalendario?.forEach(e => {
      const d = new Date(e.inicio).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
      if (!diasComEvento.includes(d)) diasComEvento.push(d);
    });
  }

  const nomeUsuario = profile?.nome?.split(" ")[0] ?? "Doutor(a)";
  const isAdmin = profile?.role === "admin";

  // Sparkline mock — em produção puxar últimas 6 semanas de faturamento
  const sparklineFaturamento = [32, 41, 28, 55, 48, 62, 48];

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1
            className="heading"
            style={{ fontFamily: "var(--font-cormorant)", fontSize: 30, fontWeight: 600, color: "#1C1C1C", lineHeight: 1.15, marginBottom: 4 }}
          >
            {saudacao()}{isAdmin ? `, Dr(a). ${nomeUsuario}` : `, ${nomeUsuario}`}
          </h1>
          <p style={{ fontSize: 13, color: "#9B9BA0", fontFamily: "var(--font-montserrat)" }}>
            {dataExtenso()} · {consultasHoje} atendimento{consultasHoje !== 1 ? "s" : ""} hoje
          </p>
        </div>
        <a href="/agenda" className="btn-primary">
          + Novo agendamento
        </a>
      </div>

      {/* KPIs — 4 colunas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Faturamento do Mês"
          value={fmtBRL(faturamentoMes)}
          sub="Orçamentos aprovados"
          trend="+12% vs mês anterior"
          trendUp
          color="green"
          sparkline={sparklineFaturamento}
        />
        <KpiCard
          title="Consultas Hoje"
          value={String(consultasHoje)}
          sub={`${confirmados} confirmadas`}
          trend={consultasHoje > 0 ? `${confirmados} de ${consultasHoje}` : "Nenhuma"}
          trendUp={confirmados > 0}
          color="blue"
        />
        <KpiCard
          title="Taxa de Comparecimento"
          value={consultasHoje > 0 ? `${Math.round((confirmados / consultasHoje) * 100)}%` : "—"}
          sub="Confirmados vs agendados"
          color="green"
        />
        <KpiCard
          title="Orçamentos Abertos"
          value={String(orcamentosAbertos)}
          sub="Enviados + Negociação"
          trend={orcamentosAbertos > 5 ? "Atenção: alta demanda" : undefined}
          trendUp={false}
          color="amber"
        />
      </div>

      {/* Bento principal: CardClinica + MiniCalendário + Status do dia */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        {/* Card Clínica — 5 cols */}
        <div className="lg:col-span-5">
          <CardClinica
            nome={clinica?.nome_clinica ?? "Forma & Função"}
            especialidade={clinica?.especialidade ?? "Odontologia Integrada"}
            cro={clinica?.cro ?? undefined}
            cidade={clinica?.cidade ?? "Balneário Camboriú, SC"}
            pacientesAtivos={totalPacientes}
            profissionais={totalProfissionais}
            cadeiras={3}
          />
        </div>

        {/* Mini Calendário — 3 cols */}
        <div className="lg:col-span-3">
          <MiniCalDash diasComEvento={diasComEvento} />
        </div>

        {/* Status do dia — 4 cols */}
        <div className="lg:col-span-4">
          <div className="card h-full" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontFamily: "var(--font-montserrat)", fontWeight: 600, color: "#1C1C1C", marginBottom: 14 }}>
              Status do dia
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                {
                  icon: "✓",
                  label: "Atendimentos concluídos",
                  value: `${confirmados}/${consultasHoje}`,
                  color: "#1F7A4D",
                },
                {
                  icon: "◷",
                  label: "Próximo atendimento",
                  value: eventos.find(e => e.status === "agendado" || e.status === "confirmado")
                    ? new Date(eventos.find(e => e.status === "agendado" || e.status === "confirmado")!.inicio)
                        .toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })
                    : "—",
                  color: "#2D6AA3",
                },
                {
                  icon: "R$",
                  label: "Faturado este mês",
                  value: fmtBRL(faturamentoMes),
                  color: "#1F7A4D",
                },
                {
                  icon: "!",
                  label: "Orçamentos em aberto",
                  value: String(orcamentosAbertos),
                  color: orcamentosAbertos > 5 ? "#C98A1E" : "#6B6B66",
                },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: `${item.color}15`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, color: item.color,
                      fontFamily: "var(--font-montserrat)",
                    }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: 12, color: "#6B6B66", fontFamily: "var(--font-montserrat)" }}>
                      {item.label}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1C", fontFamily: "var(--font-montserrat)", fontVariantNumeric: "tabular-nums" }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Agenda de hoje — full width */}
      <div className="mb-4">
        <AgendaHoje
          eventos={eventos}
          dataHoje={new Date().toLocaleDateString("pt-BR", {
            timeZone: "America/Sao_Paulo",
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        />
      </div>

      {/* Bottom: pacientes recentes + gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentPatients />
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontFamily: "var(--font-montserrat)", fontWeight: 600, color: "#1C1C1C", marginBottom: 16 }}>
            Faturamento — últimos 6 meses
          </div>
          <RevenueChart />
        </div>
      </div>
    </div>
  );
}
