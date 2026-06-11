import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { token } = await req.json().catch(() => ({}));

  if (!token) return NextResponse.json({ error: 'Token obrigatório' }, { status: 400 });

  const supabase = await createClient();

  const { data: c } = await supabase
    .from('contratos')
    .select('id, status, sign_token')
    .eq('id', id)
    .eq('sign_token', token)
    .single();

  if (!c) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  if (c.status === 'enviado') {
    await supabase.from('contratos').update({
      status: 'visualizado',
      visualizado_em: new Date().toISOString(),
    }).eq('id', id);
  }

  return NextResponse.json({ ok: true });
}
