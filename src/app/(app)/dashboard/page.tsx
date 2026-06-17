import { createClient } from '@/lib/supabase/server';
import { KpiCard } from '@/components/ui/KpiCard';
import { MiniCalendar } from '@/components/ui/MiniCalendar';
import { ClinicaCard } from '@/components/ui/ClinicaCard';
import { AgendaHoje } from '@/components/dashboard/AgendaHoje';
import { RecentPatients } from '@/components/dashboard/RecentPatients';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function ptDataLonga(d: Date) {
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
    timeZone: 'America/Sao_Paulo',
  });
}

function saudacao() {
  const h = new Date().toLocaleString('pt-BR', { hour: 'numeric', hour12: false, timeZone: 'America/Sao_Paulo' });
  if (parseInt(h) < 12) return 'Bom dia';
  if (parseInt(h) < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default async function DashboardPage() {
  const hoje = new Date();
  const hojeStr = hoje.toISOString().slice(0, 10);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10);
  const dataLonga = ptDataLonga(hoje);
  const saud = saudacao();

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
      if (eventosRes.data) eventosHoje = eventosRes.data as unknown as typeof eventosHoje;
      if (pacRes.data) pacientesRecentes = pacRes.data;
      if (pacAtivoRes.count) kpiPacientesAtivos = pacAtivoRes.count;
      kpiConsultasHoje = eventosHoje.length;

      const { count: novos } = await supabase
        .from('pacientes')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .gte('created_at', `${inicioMes}T00:00:00`);
      kpiPacientesNovos = novos ?? 0;

      if (eventsMesRes.data) {
        diasComEvento = [...new Set(eventsMesRes.data.map(e => e.inicio.slice(0, 10)))];
      }
    } catch {
      // Supabase indisponível — valores padrão mantidos
    }
  }

  const confirmadas = eventosHoje.filter(e => e.status === 'confirmado').length;

  return (
    <div>
      {/* ── Boas-vindas ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 10, fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#6B6B66', marginBottom: 4 }}>
            {clinicaCfg.nome ?? 'Forma & Função'} · {clinicaCfg.cidade ?? 'Balneário Camboriú'}
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, color: '#1C1C1C', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 4 }}>
            {saud}
          </h1>
          <p style={{ fontSize: 13, color: '#6B6B66', fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>
            {dataLonga}
          </p>
        </div>
        <Link
          href="/agenda"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 10, fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
            background: '#1F7A4D', color: '#FFFFFF', textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(31,122,77,0.25)',
          }}
        >
          Abrir Agenda
        </Link>
      </div>

      {/* ── Grid principal ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '30% 1fr 26%', gap: 16, alignItems: 'start' }} className="dash-grid">

        {/* ══ COLUNA A ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ClinicaCard
            nome={clinicaCfg.nome ?? 'Forma & Função'}
            subtitulo={`${clinicaCfg.especialidade ?? 'Odontologia Estética'} · ${clinicaCfg.cidade ?? 'Balneário Camboriú'}`}
            contadores={[
              { label: 'Pacientes ativos', value: kpiPacientesAtivos || 347, accent: true },
              { label: 'Novos este mês', value: kpiPacientesNovos || 28 },
            ]}
          />

          <KpiCard
            label="Consultas Hoje"
            value={String(kpiConsultasHoje || 8)}
            sub={`${confirmadas || 3} confirmadas`}
            delta="+2 vs ontem"
            trend="up"
          />

          <KpiCard
            label="Orçamentos Pendentes"
            value="14"
            sub="R$ 32.450 em aberto"
            delta="5 vencem em 7 dias"
            trend="down"
          />
        </div>

        {/* ══ COLUNA B ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* KPIs financeiros */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <KpiCard
              label="Faturamento do Mês"
              value="R$ 48.700"
              sub="Meta: R$ 60.000"
              delta="+12% vs jun/25"
              trend="up"
            />
            <KpiCard
              label="A Receber (30 dias)"
              value="R$ 21.300"
              sub="8 contas em aberto"
              delta="3 vencendo hoje"
              trend="neutral"
            />
          </div>

          {/* Pacientes recentes */}
          <RecentPatients pacientes={pacientesRecentes.length > 0 ? pacientesRecentes : undefined} />
        </div>

        {/* ══ COLUNA C ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <MiniCalendar diasComEvento={diasComEvento} />
          <AgendaHoje eventos={eventosHoje} dataHoje={dataLonga} />
        </div>
      </div>

      <style>{`
        @media (max-width: 1279px) {
          .dash-grid { grid-template-columns: 1fr 1fr !important; }
          .dash-grid > :nth-child(3) { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        }
        @media (max-width: 767px) {
          .dash-grid { grid-template-columns: 1fr !important; }
          .dash-grid > :nth-child(3) { grid-column: unset; display: flex; flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
