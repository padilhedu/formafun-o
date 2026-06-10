import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { ContaPagar } from '@/types/financeiro';
import { PagarClient } from '@/components/financeiro/PagarClient';

export const dynamic = 'force-dynamic';

export default async function ContasPagarPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <div className="text-muted p-8">Configure o Supabase.</div>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('contas_pagar')
    .select('*')
    .order('vencimento');

  const contas = (data as ContaPagar[]) ?? [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="heading text-4xl text-offwhite mb-1" style={{ fontFamily: 'var(--font-cormorant)' }}>
          Contas a Pagar
        </h1>
        <p className="text-muted text-sm">Despesas, fornecedores e custos fixos da clínica</p>
      </div>
      <PagarClient contas={contas} />
    </div>
  );
}
