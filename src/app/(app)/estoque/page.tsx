import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { EstoqueClient } from '@/components/estoque/EstoqueClient';

export const dynamic = 'force-dynamic';

async function sb() {
  const c = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => c.getAll(), setAll: () => {} } });
}

export default async function EstoquePage() {
  const client = await sb();
  const { data: itens } = await client.from('estoque_itens').select('*').eq('ativo', true).order('nome');
  return (
    <div className="space-y-4">
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontFamily: 'var(--font-montserrat)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B89A5A', marginBottom: 4 }}>OPERACIONAL</p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 32, fontWeight: 600, color: '#F5F2EA', lineHeight: 1.1, marginBottom: 4 }}>Estoque</h1>
        <p style={{ fontSize: 13, color: '#8A8A93', fontFamily: 'var(--font-montserrat)' }}>Controle de materiais, insumos e EPIs. Clique em "Mover" para registrar entrada ou saída.</p>
      </div>
      <EstoqueClient itensIniciais={itens ?? []} />
    </div>
  );
}
