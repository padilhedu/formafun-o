import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ProteseClient } from '@/components/protese/ProteseClient';

export const dynamic = 'force-dynamic';

async function sb() {
  const c = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => c.getAll(), setAll: () => {} } });
}

export default async function ProtesePage() {
  const client = await sb();
  const [{ data: pedidos }, { data: pacientes }] = await Promise.all([
    client.from('protese_pedidos').select('*, pacientes(nome)').order('criado_em', { ascending: false }),
    client.from('pacientes').select('id, nome').eq('ativo', true).order('nome'),
  ]);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="heading text-offwhite" style={{ fontSize: '1.6rem' }}>Prótese</h1>
        <p className="text-muted text-xs mt-0.5">Pedidos a laboratórios. Acompanhe status, prazo e entrega de cada trabalho protético.</p>
      </div>
      <ProteseClient pedidosIniciais={pedidos ?? []} pacientes={pacientes ?? []} />
    </div>
  );
}
