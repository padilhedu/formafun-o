import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Acesso negado — apenas admin' }, { status: 403 });

  const { email, role } = await req.json();
  if (!email || !role) return NextResponse.json({ error: 'email e role obrigatórios' }, { status: 400 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' }, { status: 503 });
  }

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { role },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/auth/callback`,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create profile for invited user
  if (data.user) {
    await admin.from('profiles').upsert({ id: data.user.id, role, email });
  }

  // Audit log
  await sb.from('audit_log').insert({
    usuario_id: user.id, usuario_email: user.email,
    acao: 'invite_user', tabela: 'profiles', dados: { email, role },
  });

  return NextResponse.json({ ok: true });
}
