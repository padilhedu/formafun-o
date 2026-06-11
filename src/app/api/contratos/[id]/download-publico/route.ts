import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Token obrigatório' }, { status: 400 });

  const supabase = await createClient();

  const { data: c } = await supabase
    .from('contratos')
    .select('id, paciente_id, status, sign_token, pdf_signed_url, codigo')
    .eq('id', id)
    .eq('sign_token', token)
    .single();

  if (!c || c.status !== 'assinado' || !c.pdf_signed_url) {
    return NextResponse.json({ error: 'PDF não disponível' }, { status: 404 });
  }

  // URL assinada com validade de 1 hora
  const { data: signedData, error } = await supabase.storage
    .from('contratos-assinados')
    .createSignedUrl(c.pdf_signed_url, 3600);

  if (error || !signedData) return NextResponse.json({ error: 'Erro ao gerar URL' }, { status: 500 });

  return NextResponse.redirect(signedData.signedUrl);
}
