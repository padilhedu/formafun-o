import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { ContaReceberComPaciente } from '@/types/financeiro';
import { ReceberClient } from '@/components/financeiro/ReceberClient';

export const dynamic = 'force-dynamic';

export default async function ContasReceberPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <div className="text-muted p-8">Configure o Supabase.</div>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('contas_receber')
    .select('*, pacientes(nome, cpf, email, telefone), orcamentos(codigo)')
    .order('vencimento');

  const contas = (data as ContaReceberComPaciente[]) ?? [];
  const filtro = ['pendente', 'vencido', 'pago', 'cancelado'].includes(status ?? '')
    ? (status as 'pendente' | 'vencido' | 'pago' | 'cancelado')
    : 'todos';

  return (
    <div>
      <div className="mb-8">
        <h1 className="heading text-4xl text-offwhite mb-1" style={{ fontFamily: 'var(--font-cormorant)' }}>
          Contas a Receber
        </h1>
        <p className="text-muted text-sm">Cobranças, links de pagamento Vindi e baixa manual</p>
      </div>
      <ReceberClient contas={contas} filtroInicial={filtro} />
    </div>
  );
}
