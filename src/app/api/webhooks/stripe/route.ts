import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'stripe-signature ausente' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[webhook/stripe] STRIPE_WEBHOOK_SECRET não configurado');
    return NextResponse.json({ error: 'Config inválida' }, { status: 500 });
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook/stripe] Assinatura inválida:', err);
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const contaId = session.metadata?.conta_receber_id;
      if (!contaId) break;

      // Idempotência: só atualiza se ainda não estiver pago
      const { data: conta } = await supabase
        .from('contas_receber')
        .select('id, status')
        .eq('id', contaId)
        .single();

      if (!conta || conta.status === 'pago') break;

      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : null;

      await supabase
        .from('contas_receber')
        .update({
          status: 'pago',
          pago_em: new Date().toISOString(),
          forma_pagamento: 'stripe',
          valor_pago: session.amount_total ? session.amount_total / 100 : null,
          stripe_payment_intent_id: paymentIntentId,
        })
        .eq('id', contaId);
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      console.warn('[webhook/stripe] Pagamento falhou. PI:', pi.id);
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null;
      if (piId) {
        await supabase
          .from('contas_receber')
          .update({ status: 'cancelado' })
          .eq('stripe_payment_intent_id', piId)
          .neq('status', 'cancelado');
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
