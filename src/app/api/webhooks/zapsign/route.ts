import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'crypto';

function verifyHmacSha256(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Validate HMAC signature when secret is configured
  const webhookSecret = process.env.ZAPSIGN_WEBHOOK_SECRET;
  if (webhookSecret) {
    const sig = (
      req.headers.get('x-zapsign-signature') ??
      req.headers.get('x-hub-signature-256')?.replace('sha256=', '')
    );
    if (!sig || !verifyHmacSha256(rawBody, sig, webhookSecret)) {
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    }
  }

  let body: { event_type?: string; doc_token?: string; signer_token?: string };
  try { body = JSON.parse(rawBody); } catch { return NextResponse.json({ ok: true }); }

  const { event_type, doc_token } = body;
  if (!doc_token) return NextResponse.json({ ok: true });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (event_type === 'sign' || event_type === 'doc_signed') {
    const { data: contrato } = await supabase
      .from('contratos')
      .select('id, orcamento_id, paciente_id')
      .eq('zapsign_doc_token', doc_token)
      .single();

    if (contrato) {
      const c = contrato as { id: string; orcamento_id: string | null; paciente_id: string };

      await supabase
        .from('contratos')
        .update({ status: 'assinado', assinado_em: new Date().toISOString() })
        .eq('id', c.id);

      if (process.env.ZAPSIGN_API_TOKEN) {
        try {
          const docRes = await fetch(`https://api.zapsign.com.br/api/v1/docs/${doc_token}/`, {
            headers: { 'Authorization': `api_key ${process.env.ZAPSIGN_API_TOKEN}` },
          });
          if (docRes.ok) {
            const docData = await docRes.json() as { signed_file?: string };
            if (docData.signed_file) {
              const pdfRes = await fetch(docData.signed_file);
              if (pdfRes.ok) {
                const pdfBuffer = await pdfRes.arrayBuffer();
                const path = `contratos/${c.id}/assinado.pdf`;
                await supabase.storage.from('documentos').upload(path, pdfBuffer, {
                  contentType: 'application/pdf', upsert: true,
                });
                const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path);
                await supabase.from('contratos').update({ pdf_url: urlData.publicUrl, storage_path: path }).eq('id', c.id);
              }
            }
          }
        } catch {
          // Non-fatal — PDF download failure doesn't block signing
        }
      }

      if (c.orcamento_id) {
        await supabase.from('orcamentos').update({ travado: true }).eq('id', c.orcamento_id);
        await supabase.from('orcamento_historico').insert({
          orcamento_id: c.orcamento_id,
          evento: 'contrato_assinado',
          detalhes: { contrato_id: c.id, doc_token },
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
