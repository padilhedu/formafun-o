import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json() as {
    status?: string;
    descricao?: string;
    categoria?: string;
    fornecedor?: string;
    valor?: number;
    valor_pago?: number;
    vencimento?: string;
    forma_pagamento?: string;
    recorrente?: boolean;
    observacoes?: string;
  };

  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) {
    updates.status = body.status;
    if (body.status === 'pago') {
      updates.pago_em = new Date().toISOString();
      updates.valor_pago = body.valor_pago ?? null;
    }
  }
  for (const k of ['descricao', 'categoria', 'fornecedor', 'valor', 'valor_pago', 'vencimento', 'forma_pagamento', 'recorrente', 'observacoes'] as const) {
    if (body[k] !== undefined) updates[k] = body[k];
  }

  const { data, error } = await supabase
    .from('contas_pagar')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { error } = await supabase.from('contas_pagar').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
