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
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontFamily: 'var(--font-montserrat)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1F7A4D', marginBottom: 4 }}>FINANCEIRO</p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 32, fontWeight: 600, color: '#1C1C1C', lineHeight: 1.1, marginBottom: 4 }}>
          Contas a Receber
        </h1>
        <p style={{ fontSize: 13, color: '#6B6B66', fontFamily: 'var(--font-montserrat)' }}>Cobranças, links de pagamento Vindi e baixa manual</p>
      </div>
      <ReceberClient contas={contas} filtroInicial={filtro} />
    </div>
  );
}
