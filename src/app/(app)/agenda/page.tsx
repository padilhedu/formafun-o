import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AgendaClient } from '@/components/agenda/AgendaClient';

export const dynamic = 'force-dynamic';

export default async function AgendaPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <div className="text-muted p-8">Configure o Supabase para usar este módulo.</div>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const hoje = new Date();
  const dow = hoje.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  const seg = new Date(hoje); seg.setDate(hoje.getDate() + diff);
  const dom = new Date(seg); dom.setDate(seg.getDate() + 6); dom.setHours(23,59,59);

  const [{ data: eventos }, { data: pacientes }] = await Promise.all([
    supabase.from('agenda_eventos')
      .select('*, pacientes(nome, telefone)')
      .gte('inicio', seg.toISOString())
      .lte('inicio', dom.toISOString())
      .order('inicio'),
    supabase.from('pacientes')
      .select('id, nome, telefone')
      .is('deleted_at', null)
      .order('nome'),
  ]);

  return (
    <div style={{ height: '100%' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-montserrat)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1F7A4D', marginBottom: 4 }}>
            OPERACIONAL
          </div>
          <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 32, fontWeight: 600, color: '#1C1C1C', lineHeight: 1.1 }}>
            Agenda
          </h1>
        </div>
      </div>
      <AgendaClient
        eventosIniciais={eventos ?? []}
        pacientes={pacientes ?? []}
      />
    </div>
  );
}
