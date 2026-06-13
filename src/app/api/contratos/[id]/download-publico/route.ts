import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get('token');

  if (!token) return NextResponse.json({ error: 'Token ausente' }, { status: 400 });

  const supabase = await createClient();
  const { data: c } = await supabase
    .from('contratos')
    .select('id, sign_token, pdf_signed_url, status')
    .eq('id', id)
    .single();

  if (!c) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });
  if (c.sign_token !== token) return NextResponse.json({ error: 'Token inválido' }, { status: 403 });
  if (c.status !== 'assinado') return NextResponse.json({ error: 'Contrato ainda não assinado' }, { status: 400 });
  if (!c.pdf_signed_url) return NextResponse.json({ error: 'PDF ainda não disponível. Aguarde alguns instantes e tente novamente.' }, { status: 404 });

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Configuração de servidor ausente' }, { status: 500 });
  }

  const { createClient: createServiceClient } = await import('@supabase/supabase-js');
  const admin = createServiceClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: signed, error } = await admin.storage
    .from('contratos-assinados')
    .createSignedUrl(c.pdf_signed_url, 3600);

  if (error || !signed?.signedUrl) {
    console.error('[download-publico] Erro ao gerar URL assinada:', error?.message);
    return NextResponse.json({ error: 'Erro ao gerar link de download' }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
