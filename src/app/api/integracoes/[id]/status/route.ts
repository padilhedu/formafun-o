import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const CHECKS: Record<string, () => boolean> = {
  vindi:    () => Boolean(process.env.VINDI_API_KEY),
  zapsign:  () => Boolean(process.env.ZAPSIGN_API_TOKEN),
  whatsapp: () => Boolean(process.env.WHATSAPP_API_TOKEN),
  drive:    () => Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID),
};

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const checker = CHECKS[id];
  if (!checker) return NextResponse.json({ error: 'Integração não encontrada' }, { status: 404 });

  const configured = checker();
  return NextResponse.json({ status: configured ? 'ok' : 'dev' });
}
