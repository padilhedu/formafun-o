import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabase } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Verificar autenticação (rota interna — apenas staff)
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const supabase = createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await req.json() as { conta_receber_id?: string };
    const { conta_receber_id } = body;

    if (!conta_receber_id) {
      return NextResponse.json({ error: 'conta_receber_id obrigatório' }, { status: 400 });
    }

    // Valor sempre calculado do banco — nunca confiar no cliente
    const { data: conta, error: contaErr } = await supabase
      .from('contas_receber')
      .select('id, codigo, descricao, valor, status, paciente_id, stripe_checkout_session_id')
      .eq('id', conta_receber_id)
      .single();

    if (contaErr || !conta) {
      return NextResponse.json({ error: 'Cobrança não encontrada' }, { status: 404 });
    }

    if (conta.status === 'pago' || conta.status === 'cancelado') {
      return NextResponse.json({ error: `Cobrança já está ${conta.status}` }, { status: 400 });
    }

    const stripe = getStripe();

    // Reusar sessão existente se ainda estiver aberta
    if (conta.stripe_checkout_session_id) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(conta.stripe_checkout_session_id);
        if (existing.status === 'open') {
          return NextResponse.json({ url: existing.url });
        }
      } catch {
        // Sessão expirada ou inválida — criar nova
      }
    }

    // Obter ou criar cliente Stripe
    let stripeCustomerId: string | undefined;
    if (conta.paciente_id) {
      const { data: paciente } = await supabase
        .from('pacientes')
        .select('id, nome, email, stripe_customer_id')
        .eq('id', conta.paciente_id)
        .single();

      if (paciente) {
        if (paciente.stripe_customer_id) {
          stripeCustomerId = paciente.stripe_customer_id;
        } else {
          const customer = await stripe.customers.create({
            name: paciente.nome,
            email: paciente.email ?? undefined,
            metadata: { paciente_id: paciente.id },
          });
          stripeCustomerId = customer.id;
          await supabase
            .from('pacientes')
            .update({ stripe_customer_id: customer.id })
            .eq('id', paciente.id);
        }
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card', 'pix'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: conta.descricao,
            description: `Ref: ${conta.codigo}`,
          },
          unit_amount: Math.round(Number(conta.valor) * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${appUrl}/pagamentos/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pagamentos/cancelado`,
      metadata: { conta_receber_id: conta.id, codigo: conta.codigo },
    });

    // Salvar ID da sessão para idempotência no webhook
    await supabase
      .from('contas_receber')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', conta.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[checkout] Erro Stripe:', err);
    return NextResponse.json({ error: 'Erro ao criar sessão de pagamento' }, { status: 500 });
  }
}
