import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json() as {
    status?: string;
    forma_pagamento?: string;
    valor_pago?: number;
    vencimento?: string;
    valor?: number;
    descricao?: string;
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
  if (body.forma_pagamento !== undefined) updates.forma_pagamento = body.forma_pagamento;
  if (body.valor_pago !== undefined) updates.valor_pago = body.valor_pago;
  if (body.vencimento !== undefined) updates.vencimento = body.vencimento;
  if (body.valor !== undefined) updates.valor = body.valor;
  if (body.descricao !== undefined) updates.descricao = body.descricao;
  if (body.observacoes !== undefined) updates.observacoes = body.observacoes;

  const { data, error } = await supabase
    .from('contas_receber')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
