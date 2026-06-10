import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { LeadsKanban } from '@/components/leads/LeadsKanban';

export const dynamic = 'force-dynamic';

async function sb() {
  const c = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => c.getAll(), setAll: () => {} } });
}

export default async function LeadsPage() {
  const client = await sb();
  const { data: leads } = await client.from('leads').select('*').order('criado_em', { ascending: false });
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="heading text-3xl text-offwhite mb-1" style={{ fontFamily: 'var(--font-cormorant)' }}>CRM / Leads</h1>
          <p className="text-muted text-sm">Pipeline de captação. Avance os cards com as setas ou clique para editar.</p>
        </div>
      </div>
      <LeadsKanban leadsIniciais={leads ?? []} />
    </div>
  );
}
