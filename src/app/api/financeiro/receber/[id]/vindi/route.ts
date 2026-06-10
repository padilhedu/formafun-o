import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { vindiConfigured, ensureVindiCustomer, criarCobrancaVindi } from '@/lib/vindi';

// Gera cobrança Vindi para uma conta a receber
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { data: conta, error: contaErr } = await supabase
    .from('contas_receber')
    .select('*, pacientes(id, nome, cpf, email, telefone, vindi_customer_id)')
    .eq('id', id)
    .single();

  if (contaErr || !conta) return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });

  const c = conta as {
    id: string; valor: number; descricao: string; codigo: string;
    vencimento: string; forma_pagamento: string | null; status: string;
    vindi_bill_id: string | null;
    pacientes: { id: string; nome: string; cpf: string | null; email: string | null; telefone: string | null; vindi_customer_id: string | null } | null;
  };

  if (c.status === 'pago') return NextResponse.json({ error: 'Conta já paga' }, { status: 400 });
  if (c.vindi_bill_id) return NextResponse.json({ error: 'Cobrança Vindi já gerada' }, { status: 400 });
  if (!c.pacientes) return NextResponse.json({ error: 'Conta sem paciente vinculado' }, { status: 400 });

  if (!vindiConfigured()) {
    return NextResponse.json({
      _dev_mode: true,
      message: 'VINDI_API_KEY ausente — cobrança não gerada (modo dev)',
    });
  }

  try {
    const customerId = await ensureVindiCustomer(c.pacientes);

    // Persiste vindi_customer_id no paciente
    if (!c.pacientes.vindi_customer_id) {
      await supabase
        .from('pacientes')
        .update({ vindi_customer_id: String(customerId) })
        .eq('id', c.pacientes.id);
    }

    const cobranca = await criarCobrancaVindi({
      customerId,
      valor: c.valor,
      descricao: `${c.codigo} — ${c.descricao}`,
      formaPagamento: c.forma_pagamento ?? 'pix',
      vencimento: c.vencimento,
    });

    const { data: updated, error: updErr } = await supabase
      .from('contas_receber')
      .update({
        vindi_bill_id: cobranca.bill_id,
        vindi_charge_id: cobranca.charge_id,
        vindi_url: cobranca.url,
      })
      .eq('id', id)
      .select()
      .single();

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro Vindi' }, { status: 502 });
  }
}
