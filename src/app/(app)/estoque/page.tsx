import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { EstoqueClient } from '@/components/estoque/EstoqueClient';

export const dynamic = 'force-dynamic';

function sb() {
  const c = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => c.getAll(), setAll: () => {} } });
}

export default async function EstoquePage() {
  const { data: itens } = await sb().from('estoque_itens').select('*').eq('ativo', true).order('nome');
  return (
    <div className="space-y-4">
      <div>
        <h1 className="heading text-offwhite" style={{ fontSize: '1.6rem' }}>Estoque</h1>
        <p className="text-muted text-xs mt-0.5">Controle de materiais, insumos e EPIs. Clique em "Mover" para registrar entrada ou saída.</p>
      </div>
      <EstoqueClient itensIniciais={itens ?? []} />
    </div>
  );
}
