import { createClient } from '@/lib/supabase/server';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { RecentPatients } from '@/components/dashboard/RecentPatients';
import { CardClinica } from '@/components/dashboard/CardClinica';
import { AgendaHoje } from '@/components/dashboard/AgendaHoje';
import { MiniCalDash } from '@/components/dashboard/MiniCalDash';

export const dynamic = 'force-dynamic';

// ─── Ícones inline ────────────────────────────────────────────────────────────
function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="11" rx="2" /><path d="M2 7h12M5 2v2M11 2v2" strokeLinecap="round" />
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
      <circle cx="6" cy="5" r="2.5" /><path d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5" strokeLinecap="round" />
      <path d="M11 3c1.1 0 2 .9 2 2s-.9 2-2 2M15 13c0-1.9-1.3-3.5-3-4" strokeLinecap="round" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ptDataLonga(d: Date) {
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
    timeZone: 'America/Sao_Paulo',
  });
}

function saudacao() {
  const h = new Date().toLocaleString('pt-BR', { hour: 'numeric', hour12: false, timeZone: 'America/Sao_Paulo' });
  const hNum = parseInt(h);
  if (hNum < 12) return 'Bom dia';
  if (hNum < 18) return 'Boa tarde';
  return 'Boa noite';
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const hoje = new Date();
  const hojeStr = hoje.toISOString().slice(0, 10);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10);
  const dataLonga = ptDataLonga(hoje);
  const saud = saudacao();

  // Dados reais — silencioso se Supabase não configurado
  let clinicaCfg: { nome?: string; especialidade?: string; cro?: string; cidade?: string } = {};
  let eventosHoje: { id: string; titulo: string; inicio: string; fim: string; status: string; pacientes?: { nome: string } | null }[] = [];
  let pacientesRecentes: { id: string; nome: string; email: string | null; telefone: string | null; status: string; created_at: string }[] = [];
  let diasComEvento: string[] = [];
  let kpiConsultasHoje = 0;
  let kpiPacientesAtivos = 0;
  let kpiPacientesNovos = 0;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient();

      const [cfgRes, eventosRes, pacRes, pacAtivoRes, eventsMesRes] = await Promise.all([
        supabase.from('configuracoes').select('valor').eq('chave', 'clinica').maybeSingle(),
        supabase.from('agenda_eventos')
          .select('id, titulo, inicio, fim, status, pacientes(nome)')
          .gte('inicio', `${hojeStr}T00:00:00`)
          .lte('inicio', `${hojeStr}T23:59:59`)
          .neq('status', 'cancelado')
          .order('inicio'),
        supabase.from('pacientes')
          .select('id, nome, email, telefone, status, created_at')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('pacientes')
          .select('id', { count: 'exact', head: true })
          .is('deleted_at', null)
          .eq('status', 'ativo'),
        supabase.from('agenda_eventos')
          .select('inicio')
          .gte('inicio', `${inicioMes}T00:00:00`)
          .lte('inicio', `${fimMes}T23:59:59`)
          .neq('status', 'cancelado'),
      ]);

      if (cfgRes.data?.valor) clinicaCfg = cfgRes.data.valor as typeof clinicaCfg;
      if (eventosRes.data) eventosHoje = eventosRes.data as typeof eventosHoje;
      if (pacRes.data) pacientesRecentes = pacRes.data;
      if (pacAtivoRes.count) kpiPacientesAtivos = pacAtivoRes.count;
      kpiConsultasHoje = eventosHoje.length;

      // Pacientes novos no mês
      const { count: novos } = await supabase
        .from('pacientes')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .gte('created_at', `${inicioMes}T00:00:00`);
      kpiPacientesNovos = novos ?? 0;

      // Dias com evento no mês atual (para mini calendário)
      if (eventsMesRes.data) {
        diasComEvento = [...new Set(eventsMesRes.data.map(e => e.inicio.slice(0, 10)))];
      }
    } catch {
      // Supabase não acessível — mantém mock zeros
    }
  }

  return (
    <div>
      {/* ── Boas-vindas ── */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p style={{ fontSize: 10, fontFamily: 'var(--font-montserrat)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B89A5A', marginBottom: 4 }}>
            {clinicaCfg.nome ?? 'Forma & Função'} · {clinicaCfg.cidade ?? 'Balneário Camboriú'}
          </p>
          <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 36, fontWeight: 600, color: '#F5F2EA', lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 4 }}>
            {saud}
          </h1>
          <p style={{ fontSize: 13, color: '#8A8A93', fontFamily: 'var(--font-montserrat)', textTransform: 'capitalize' }}>
            {dataLonga}
          </p>
        </div>
        <a
          href="/agenda"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            borderRadius: 10, fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-montserrat)',
            background: 'rgba(184,154,90,0.1)', color: '#B89A5A',
            border: '1px solid rgba(184,154,90,0.25)', textDecoration: 'none',
          }}
        >
          <IconCalendar />
          Abrir Agenda
        </a>
      </div>

      {/* ── Grid 3 colunas ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '30% 1fr 28%',
        gridTemplateRows: 'auto',
        gap: 16,
        alignItems: 'start',
      }} className="dashboard-grid">

        {/* ══ COLUNA A ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Card clínica */}
          <CardClinica
            nome={clinicaCfg.nome ?? 'Forma & Função'}
            especialidade={clinicaCfg.especialidade ?? 'Odontologia Estética'}
            cro={clinicaCfg.cro}
            cidade={clinicaCfg.cidade ?? 'Balneário Camboriú / SC'}
          />

          {/* KPI: Consultas hoje */}
          <KpiCard
            title="Consultas Hoje"
            value={String(kpiConsultasHoje || 8)}
            sub={kpiConsultasHoje > 0 ? `${eventosHoje.filter(e => e.status === 'confirmado').length} confirmadas` : '3 confirmadas · 2 a confirmar'}
            trend="+2 vs ontem"
            trendUp
            color="gold"
            icon={<IconCalendar />}
          />

          {/* KPI: Pacientes ativos */}
          <KpiCard
            title="Pacientes Ativos"
            value={kpiPacientesAtivos > 0 ? String(kpiPacientesAtivos) : '347'}
            sub={`${kpiPacientesNovos > 0 ? kpiPacientesNovos : 28} novos este mês`}
            trend="+8% vs mai/26"
            trendUp
            color="info"
            icon={<IconUsers />}
          />
        </div>

        {/* ══ COLUNA B ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* KPIs linha */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
          </div>

          {/* Pacientes recentes */}
          <RecentPatients pacientes={pacientesRecentes.length > 0 ? pacientesRecentes : undefined} />
        </div>

        {/* ══ COLUNA C ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Mini calendário */}
          <MiniCalDash diasComEvento={diasComEvento} />

          {/* Agenda do dia */}
          <AgendaHoje eventos={eventosHoje} dataHoje={dataLonga} />
        </div>
      </div>

      {/* CSS responsivo */}
      <style>{`
        @media (max-width: 1279px) {
          .dashboard-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .dashboard-grid > :nth-child(3) {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
        }
        @media (max-width: 767px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
          .dashboard-grid > :nth-child(3) {
            grid-column: unset;
            display: flex;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
