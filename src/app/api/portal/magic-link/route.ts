import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 });

  const sb = await createClient();

  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/portal`,
      shouldCreateUser: false, // só aceita e-mails já cadastrados
    },
  });

  if (error) return NextResponse.json({ error: 'E-mail não encontrado ou não habilitado no portal' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
