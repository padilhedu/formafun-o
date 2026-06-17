import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  agendado:   { label: 'Agendado', color: '#60A5FA' },
  confirmado: { label: 'Confirmado', color: '#1F7A4D' },
  realizado:  { label: 'Realizado', color: '#6B6B66' },
  cancelado:  { label: 'Cancelado', color: '#C0392B' },
  faltou:     { label: 'Faltou', color: '#C98A1E' },
};

export default async function PortalConsultasPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/portal/login');

  const { data: acesso } = await sb.from('portal_acessos').select('paciente_id').eq('user_id', user.id).single();
  if (!acesso) redirect('/portal');

  const now = new Date().toISOString();
  const { data: futuras } = await sb.from('agenda_eventos')
    .select('id, data_hora, status, tipo, notas_publicas, duracao_minutos')
    .eq('paciente_id', acesso.paciente_id)
    .gte('data_hora', now)
    .order('data_hora');

  const { data: passadas } = await sb.from('agenda_eventos')
    .select('id, data_hora, status, tipo, notas_publicas, duracao_minutos')
    .eq('paciente_id', acesso.paciente_id)
    .lt('data_hora', now)
    .order('data_hora', { ascending: false })
    .limit(20);

  function ConsultaCard({ c }: { c: typeof futuras extends (infer T)[] | null ? T : never }) {
    const cfg = STATUS_LABEL[c!.status ?? 'agendado'] ?? STATUS_LABEL.agendado;
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 13, color: '#1C1C1C', fontFamily: 'var(--font-montserrat)', fontWeight: 600, margin: 0 }}>
              {new Date(c!.data_hora).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p style={{ fontSize: 12, color: '#6B6B66', marginTop: 3 }}>
              {new Date(c!.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              {c!.duracao_minutos && ` · ${c!.duracao_minutos} min`}
              {c!.tipo && ` · ${c!.tipo}`}
            </p>
            {c!.notas_publicas && <p style={{ fontSize: 12, color: '#6B6B66', marginTop: 4 }}>{c!.notas_publicas}</p>}
          </div>
          <span style={{ fontSize: 11, color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`, borderRadius: 5, padding: '2px 8px', fontFamily: 'var(--font-montserrat)', fontWeight: 600, flexShrink: 0 }}>
            {cfg.label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/portal" style={{ color: '#6B6B66', fontSize: 13 }}>← Início</Link>
      </div>
      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.6rem', color: '#1F7A4D', fontWeight: 600, margin: 0 }}>
        Minhas Consultas
      </h1>

      {(futuras ?? []).length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: '#1F7A4D', fontFamily: 'var(--font-montserrat)', fontWeight: 700, marginBottom: 10 }}>Próximas</p>
          <div className="space-y-2">{(futuras ?? []).map(c => <ConsultaCard key={c.id} c={c} />)}</div>
        </div>
      )}

      {(passadas ?? []).length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: '#6B6B66', fontFamily: 'var(--font-montserrat)', fontWeight: 700, marginBottom: 10 }}>Histórico</p>
          <div className="space-y-2">{(passadas ?? []).map(c => <ConsultaCard key={c.id} c={c} />)}</div>
        </div>
      )}

      {(futuras ?? []).length === 0 && (passadas ?? []).length === 0 && (
        <div className="card p-8 text-center">
          <p style={{ color: '#6B6B66', fontSize: 13 }}>Nenhuma consulta registrada.</p>
        </div>
      )}
    </div>
  );
}
