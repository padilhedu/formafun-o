import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { AgendaClient } from '@/components/agenda/AgendaClient';

export const dynamic = 'force-dynamic';

function supabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
}

export default async function AgendaPage() {
  const sb = supabase();

  // Semana atual (Seg–Dom)
  const hoje = new Date();
  const dow = hoje.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  const seg = new Date(hoje); seg.setDate(hoje.getDate() + diff);
  const dom = new Date(seg); dom.setDate(seg.getDate() + 6); dom.setHours(23,59,59);

  const [{ data: eventos }, { data: pacientes }] = await Promise.all([
    sb.from('agenda_eventos')
      .select('*, pacientes(nome, telefone)')
      .gte('inicio', seg.toISOString())
      .lte('inicio', dom.toISOString())
      .order('inicio'),
    sb.from('pacientes')
      .select('id, nome, telefone')
      .eq('ativo', true)
      .order('nome'),
  ]);

  return (
    <div className="flex flex-col gap-4" style={{ height: '100%' }}>
      <div>
        <h1 className="heading text-offwhite" style={{ fontSize: '1.6rem' }}>Agenda</h1>
        <p className="text-muted text-xs mt-0.5">Visualize e gerencie consultas. Clique em um horário para criar evento.</p>
      </div>
      <AgendaClient
        eventosIniciais={eventos ?? []}
        pacientes={pacientes ?? []}
      />
    </div>
  );
}
