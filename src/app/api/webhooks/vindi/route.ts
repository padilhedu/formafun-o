import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'crypto';

function verifyVindiSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

type VindiEvent = {
  event?: {
    type?: string;
    data?: {
      bill?: { id: number; status: string; charges?: { id: number; payment_method?: { code: string } }[] };
      charge?: { id: number; status: string; bill?: { id: number }; payment_method?: { code: string } };
    };
  };
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const webhookSecret = process.env.VINDI_WEBHOOK_SECRET;
  if (webhookSecret) {
    const sig = req.headers.get('x-vindi-signature') ?? req.headers.get('x-hub-signature-256')?.replace('sha256=', '') ?? null;
    if (!verifyVindiSignature(rawBody, sig, webhookSecret)) {
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    }
  }

  let body: VindiEvent;
  try { body = JSON.parse(rawBody); } catch { return NextResponse.json({ ok: true }); }

  const type = body.event?.type;
  if (!type) return NextResponse.json({ ok: true });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (type === 'bill_paid' || type === 'charge_paid') {
    const billId = body.event?.data?.bill?.id ?? body.event?.data?.charge?.bill?.id;
    if (!billId) return NextResponse.json({ ok: true });

    const metodoVindi =
      body.event?.data?.charge?.payment_method?.code ??
      body.event?.data?.bill?.charges?.[0]?.payment_method?.code;

    const formaMap: Record<string, string> = {
      pix: 'pix',
      credit_card: 'cartao_credito',
      bank_slip: 'boleto',
    };

    const { data: conta } = await supabase
      .from('contas_receber')
      .select('id, valor, status')
      .eq('vindi_bill_id', String(billId))
      .single();

    if (conta && (conta as { status: string }).status !== 'pago') {
      const c = conta as { id: string; valor: number };
      await supabase
        .from('contas_receber')
        .update({
          status: 'pago',
          pago_em: new Date().toISOString(),
          valor_pago: c.valor,
          ...(metodoVindi && formaMap[metodoVindi] ? { forma_pagamento: formaMap[metodoVindi] } : {}),
        })
        .eq('id', c.id);
    }
  }

  if (type === 'bill_canceled') {
    const billId = body.event?.data?.bill?.id;
    if (billId) {
      await supabase
        .from('contas_receber')
        .update({ vindi_bill_id: null, vindi_charge_id: null, vindi_url: null })
        .eq('vindi_bill_id', String(billId))
        .neq('status', 'pago');
    }
  }

  return NextResponse.json({ ok: true });
}
