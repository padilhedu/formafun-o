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
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="heading text-3xl text-offwhite mb-1" style={{ fontFamily: 'var(--font-cormorant)' }}>Estoque</h1>
          <p className="text-muted text-sm">Controle de materiais, insumos e EPIs. Clique em "Mover" para registrar entrada ou saída.</p>
        </div>
      </div>
      <EstoqueClient itensIniciais={itens ?? []} />
    </div>
  );
}
