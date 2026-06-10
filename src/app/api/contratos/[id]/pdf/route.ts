import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAnonClient } from '@/lib/supabase/client';

// This route renders the contract HTML — used by ZapSign to fetch the document
// and by the "Imprimir" button. Supports both authenticated and public token access.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const publicToken = searchParams.get('token');

  // Try authenticated first, fall back to public token
  let contratoHtml: string | null = null;
  let contratoStatus: string | null = null;

  if (publicToken) {
    // Public access via token — use server client with anon key
    const supabaseAnon = createAnonClient();
    const { data } = await supabaseAnon
      .from('contratos')
      .select('corpo_html_final, status, token_publico')
      .eq('id', id)
      .eq('token_publico', publicToken)
      .single();
    contratoHtml = (data as { corpo_html_final?: string } | null)?.corpo_html_final ?? null;
    contratoStatus = (data as { status?: string } | null)?.status ?? null;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { data } = await supabase
      .from('contratos')
      .select('corpo_html_final, status')
      .eq('id', id)
      .single();
    contratoHtml = (data as { corpo_html_final?: string } | null)?.corpo_html_final ?? null;
    contratoStatus = (data as { status?: string } | null)?.status ?? null;
  }

  if (!contratoHtml) {
    return new NextResponse('Contrato não encontrado', { status: 404 });
  }

  // Mark as visualizado if it was sent and patient opened it
  if (publicToken && contratoStatus === 'enviado') {
    const supabase = await createClient();
    await supabase
      .from('contratos')
      .update({ status: 'visualizado' })
      .eq('id', id)
      .eq('status', 'enviado');
  }

  // Inject auto-print script for internal print button
  const printScript = !publicToken
    ? '<script>window.onload = () => { if (window.location.search.includes("print=1")) window.print(); }</script>'
    : '';

  const html = contratoHtml.replace('</body>', `${printScript}</body>`);

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
