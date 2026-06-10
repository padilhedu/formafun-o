import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ZapSign webhook — use service role client (no RLS bypass needed, but this is a public route)
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    event_type?: string;
    doc_token?: string;
    signer_token?: string;
  };

  const { event_type, doc_token } = body;
  if (!doc_token) return NextResponse.json({ ok: true });

  // Use service role for webhook (no auth session available)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (event_type === 'sign' || event_type === 'doc_signed') {
    // Find contract by ZapSign token
    const { data: contrato } = await supabase
      .from('contratos')
      .select('id, orcamento_id, paciente_id')
      .eq('zapsign_doc_token', doc_token)
      .single();

    if (contrato) {
      // Update contract to signed
      await supabase
        .from('contratos')
        .update({ status: 'assinado', assinado_em: new Date().toISOString() })
        .eq('id', (contrato as { id: string }).id);

      // Try to download the signed PDF from ZapSign and store in Supabase Storage
      if (process.env.ZAPSIGN_API_TOKEN) {
        try {
          const docRes = await fetch(`https://api.zapsign.com.br/api/v1/docs/${doc_token}/`, {
            headers: { 'Authorization': `api_key ${process.env.ZAPSIGN_API_TOKEN}` },
          });
          if (docRes.ok) {
            const docData = await docRes.json() as { signed_file?: string };
            if (docData.signed_file) {
              // Download and store PDF
              const pdfRes = await fetch(docData.signed_file);
              if (pdfRes.ok) {
                const pdfBuffer = await pdfRes.arrayBuffer();
                const path = `contratos/${(contrato as { id: string }).id}/assinado.pdf`;
                await supabase.storage.from('documentos').upload(path, pdfBuffer, {
                  contentType: 'application/pdf',
                  upsert: true,
                });
                const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path);
                await supabase
                  .from('contratos')
                  .update({ pdf_url: urlData.publicUrl, storage_path: path })
                  .eq('id', (contrato as { id: string }).id);
              }
            }
          }
        } catch {
          // Non-fatal — PDF download failure doesn't block signing
        }
      }

      // Lock the linked budget
      const orcId = (contrato as { orcamento_id: string | null }).orcamento_id;
      if (orcId) {
        await supabase
          .from('orcamentos')
          .update({ travado: true })
          .eq('id', orcId);

        await supabase.from('orcamento_historico').insert({
          orcamento_id: orcId,
          evento: 'contrato_assinado',
          detalhes: { contrato_id: (contrato as { id: string }).id, doc_token },
        });
      }
    }
  }

  if (event_type === 'view') {
    await supabase
      .from('contratos')
      .update({ status: 'visualizado' })
      .eq('zapsign_doc_token', doc_token)
      .eq('status', 'enviado');
  }

  return NextResponse.json({ ok: true });
}
