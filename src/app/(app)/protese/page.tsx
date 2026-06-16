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
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontFamily: 'var(--font-montserrat)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B89A5A', marginBottom: 4 }}>OPERACIONAL</p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 32, fontWeight: 600, color: '#F5F2EA', lineHeight: 1.1, marginBottom: 4 }}>Prótese</h1>
        <p style={{ fontSize: 13, color: '#8A8A93', fontFamily: 'var(--font-montserrat)' }}>Pedidos a laboratórios. Acompanhe status, prazo e entrega de cada trabalho protético.</p>
      </div>
      <ProteseClient pedidosIniciais={pedidos ?? []} pacientes={pacientes ?? []} />
    </div>
  );
}
