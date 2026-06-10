import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { data } = await sb.from('configuracoes').select('*');
  const map: Record<string, unknown> = {};
  for (const row of (data ?? [])) map[row.chave] = row.valor;
  return NextResponse.json(map);
}

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { chave, valor } = await req.json();
  if (!chave) return NextResponse.json({ error: 'chave obrigatória' }, { status: 400 });

  const { error } = await sb.from('configuracoes').upsert({
    chave, valor, atualizado_por: user.id, atualizado_em: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  await sb.from('audit_log').insert({
    usuario_id: user.id, usuario_email: user.email,
    acao: 'update_config', tabela: 'configuracoes', registro_id: chave,
  });

  return NextResponse.json({ ok: true });
}
