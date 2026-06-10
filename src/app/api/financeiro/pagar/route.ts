import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const status = req.nextUrl.searchParams.get('status');

  let query = supabase.from('contas_pagar').select('*').order('vencimento');
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json() as {
    descricao?: string;
    categoria?: string;
    fornecedor?: string;
    valor?: number;
    vencimento?: string;
    recorrente?: boolean;
    observacoes?: string;
  };

  if (!body.descricao || !body.valor || !body.vencimento) {
    return NextResponse.json({ error: 'Campos obrigatórios: descricao, valor, vencimento' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('contas_pagar')
    .insert({
      descricao: body.descricao,
      categoria: body.categoria ?? 'outros',
      fornecedor: body.fornecedor ?? null,
      valor: body.valor,
      vencimento: body.vencimento,
      recorrente: body.recorrente ?? false,
      observacoes: body.observacoes ?? null,
      criado_por: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
