import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { RelatoriosClient } from '@/components/relatorios/RelatoriosClient';

export const dynamic = 'force-dynamic';

const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

async function sb() {
  const c = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => c.getAll(), setAll: () => {} } });
}

export default async function RelatoriosPage() {
  const agora = new Date();
  const anoAtual = agora.getFullYear();

  const meses6: { label: string; inicio: string; fim: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    meses6.push({ label: MESES_PT[d.getMonth()], inicio: d.toISOString(), fim: fim.toISOString() });
  }

  const client = await sb();

  const [
    { data: receber },
    { data: pagar },
    { data: pacientes },
    { data: consultas },
  ] = await Promise.all([
    client.from('contas_receber').select('valor_pago, pago_em, status').gte('pago_em', `${anoAtual}-01-01`),
    client.from('contas_pagar').select('valor, pago_em, status').gte('pago_em', `${anoAtual}-01-01`),
    client.from('pacientes').select('id, criado_em').eq('ativo', true),
    client.from('agenda_eventos').select('status').gte('inicio', `${anoAtual}-01-01`),
  ]);

  const fluxo = meses6.map(({ label, inicio, fim }) => {
    const recebido = (receber ?? [])
      .filter(r => r.status === 'pago' && r.pago_em >= inicio && r.pago_em <= fim)
      .reduce((s, r) => s + Number(r.valor_pago ?? 0), 0);
    const pago = (pagar ?? [])
      .filter(p => p.status === 'pago' && p.pago_em >= inicio && p.pago_em <= fim)
      .reduce((s, p) => s + Number(p.valor ?? 0), 0);
    return { mes: label, recebido, pago, saldo: recebido - pago };
  });

  const pacientesPorMes = meses6.map(({ label, inicio, fim }) => ({
    mes: label,
    novos: (pacientes ?? []).filter(p => p.criado_em >= inicio && p.criado_em <= fim).length,
  }));

  const statusMap: Record<string, { cor: string }> = {
    agendado: { cor: '#7B5DC0' },
    confirmado: { cor: '#4ADE80' },
    realizado: { cor: '#8A8A93' },
    cancelado: { cor: '#F87171' },
    faltou: { cor: '#FBBF24' },
  };
  const consultasPorStatus = Object.entries(statusMap).map(([name, { cor }]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: (consultas ?? []).filter(c => c.status === name).length,
    color: cor,
  }));

  const totalRecebidoAno = (receber ?? []).filter(r => r.status === 'pago').reduce((s, r) => s + Number(r.valor_pago ?? 0), 0);
  const totalPagoAno = (pagar ?? []).filter(p => p.status === 'pago').reduce((s, p) => s + Number(p.valor ?? 0), 0);
  const inadimplencia = (receber ?? []).filter(r => r.status === 'pendente').reduce((s) => s + 0, 0);

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h1 className="heading text-3xl text-offwhite mb-1" style={{ fontFamily: 'var(--font-cormorant)' }}>Relatórios</h1>
        <p className="text-muted text-sm">Visão consolidada do desempenho clínico e financeiro da clínica.</p>
      </div>
      <RelatoriosClient
        fluxo={fluxo}
        pacientesPorMes={pacientesPorMes}
        consultasPorStatus={consultasPorStatus}
        totalPacientes={(pacientes ?? []).length}
        totalRecebidoAno={totalRecebidoAno}
        totalPagoAno={totalPagoAno}
        inadimplencia={inadimplencia}
      />
    </div>
  );
}
