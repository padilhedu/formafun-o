import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('contratos')
    .select('id, status, sign_url, pdf_signed_url, assinado_em, visualizado_em, recusado_em, enviado_em')
    .eq('id', id)
    .single();

  if (!data) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(data);
}
