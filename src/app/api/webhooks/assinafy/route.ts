import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { AssinafyWebhookPayload } from '@/lib/assinafy';
import { extractSignedPdfUrl } from '@/lib/assinafy';

// Idempotency: track processed events in memory (resets on cold start — acceptable,
// main guard is the DB unique constraint on external_id + event checks)
const processedEvents = new Set<string>();

export async function POST(req: NextRequest) {
  // 1. Validate webhook secret BEFORE processing any data
  const webhookSecret = process.env.ASSINAFY_WEBHOOK_SECRET;
  if (webhookSecret) {
    const authHeader =
      req.headers.get('x-assinafy-secret') ??
      req.headers.get('authorization')?.replace('Bearer ', '') ??
      req.headers.get('x-webhook-secret');

    if (!authHeader || authHeader !== webhookSecret) {
      console.warn('[Assinafy webhook] Invalid or missing auth header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const rawBody = await req.text();
  let payload: AssinafyWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as AssinafyWebhookPayload;
  } catch {
    return NextResponse.json({ received: true }); // malformed but ACK
  }

  // Log full payload on first event for field discovery
  console.log('[Assinafy webhook payload]', JSON.stringify(payload, null, 2));

  const event = payload.event ?? payload.type as string ?? 'unknown';
  const externalId = payload.external_id ?? payload.document?.external_id ?? null;
  const docId = payload.document?.id ?? payload.id as string ?? null;

  // 2. Idempotência
  const eventKey = `${event}:${externalId ?? docId}`;
  if (processedEvents.has(eventKey)) {
    console.log('[Assinafy webhook] duplicate event, skipping:', eventKey);
    return NextResponse.json({ received: true });
  }
  processedEvents.add(eventKey);

  // 3. Service client (no user session in webhook)
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Find contract by assinafy_doc_id or external_id
  let contratoId: string | null = null;
  if (externalId) {
    const { data } = await supabase.from('contratos').select('id').eq('id', externalId).single();
    contratoId = (data as { id: string } | null)?.id ?? null;
  }
  if (!contratoId && docId) {
    const { data } = await supabase.from('contratos').select('id').eq('assinafy_doc_id', docId).single();
    contratoId = (data as { id: string } | null)?.id ?? null;
  }

  if (!contratoId) {
    console.warn('[Assinafy webhook] contract not found for', { event, externalId, docId });
    return NextResponse.json({ received: true });
  }

  const now = new Date().toISOString();

  // 4. Process events
  const viewEvents = ['document.viewed', 'signer.viewed', 'document_viewed', 'signer_viewed'];
  const signedEvents = ['document.signed', 'signer.signed', 'document_signed', 'all_signed'];
  const refusedEvents = ['document.refused', 'signer.refused', 'document_refused', 'signer_refused'];

  if (viewEvents.includes(event)) {
    await supabase.from('contratos').update({ status: 'visualizado', visualizado_em: now }).eq('id', contratoId).eq('status', 'enviado');

  } else if (signedEvents.includes(event)) {
    // Fetch and store signed PDF immediately (URL expires quickly)
    let pdfSignedUrl: string | null = null;
    const doc = payload.document;
    if (doc) {
      const tempUrl = extractSignedPdfUrl(doc);
      if (tempUrl) {
        try {
          const pdfRes = await fetch(tempUrl);
          if (pdfRes.ok) {
            const pdfBuffer = await pdfRes.arrayBuffer();
            const { data: contratoData } = await supabase
              .from('contratos')
              .select('codigo, paciente_id')
              .eq('id', contratoId)
              .single();

            const c = contratoData as { codigo: string; paciente_id: string } | null;
            if (c) {
              const storagePath = `${c.paciente_id}/${c.codigo}-assinado.pdf`;
              await supabase.storage.from('contratos-assinados').upload(storagePath, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true,
              });
              // Store relative path; signed URL generated on-demand at download time
              pdfSignedUrl = storagePath;
            }
          }
        } catch (err) {
          console.error('[Assinafy webhook] PDF download/storage error:', err);
          // Non-fatal — continue with status update
        }
      }
    }

    await supabase.from('contratos').update({
      status: 'assinado',
      assinado_em: now,
      ...(pdfSignedUrl ? { pdf_signed_url: pdfSignedUrl } : {}),
    }).eq('id', contratoId);

    // Travar orçamento vinculado
    const { data: c2 } = await supabase.from('contratos').select('orcamento_id, codigo, paciente_id').eq('id', contratoId).single();
    const orcId = (c2 as { orcamento_id: string | null } | null)?.orcamento_id;
    const contratoCode = (c2 as { codigo: string } | null)?.codigo ?? '';
    const pacienteId = (c2 as { paciente_id: string } | null)?.paciente_id ?? '';

    if (orcId) {
      await supabase.from('orcamentos').update({ travado: true }).eq('id', orcId);
      await supabase.from('orcamento_historico').insert({
        orcamento_id: orcId,
        evento: 'contrato_assinado',
        detalhes: { contrato_id: contratoId },
      });
    }

    // Notificação interna para admin/recepcao
    const { data: pacData } = await supabase.from('pacientes').select('nome').eq('id', pacienteId).single();
    const pacNome = (pacData as { nome: string } | null)?.nome ?? 'paciente';

    const { data: staffUsers } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'recepcao']);

    if (staffUsers && staffUsers.length > 0) {
      await supabase.from('notificacoes').insert(
        (staffUsers as { id: string }[]).map(u => ({
          usuario_id: u.id,
          tipo: 'success',
          titulo: `Contrato ${contratoCode} assinado`,
          corpo: `${pacNome} assinou o contrato digitalmente.`,
        }))
      );
    }

    await supabase.from('audit_log').insert({
      acao: 'contrato_assinado_webhook',
      tabela: 'contratos',
      registro_id: contratoId,
      detalhes: { event, doc_id: docId },
    });

  } else if (refusedEvents.includes(event)) {
    await supabase.from('contratos').update({ status: 'recusado', recusado_em: now }).eq('id', contratoId);

    // Notificação interna
    const { data: c3 } = await supabase.from('contratos').select('codigo, paciente_id').eq('id', contratoId).single();
    const { data: pacData3 } = await supabase.from('pacientes').select('nome').eq('id', (c3 as { paciente_id: string } | null)?.paciente_id ?? '').single();
    const pacNome3 = (pacData3 as { nome: string } | null)?.nome ?? 'paciente';

    const { data: staffUsers2 } = await supabase.from('profiles').select('id').in('role', ['admin', 'recepcao']);
    if (staffUsers2 && staffUsers2.length > 0) {
      await supabase.from('notificacoes').insert(
        (staffUsers2 as { id: string }[]).map(u => ({
          usuario_id: u.id,
          tipo: 'error',
          titulo: `Contrato ${(c3 as { codigo: string } | null)?.codigo ?? ''} recusado`,
          corpo: `${pacNome3} recusou assinar o contrato.`,
        }))
      );
    }

  } else {
    console.log('[Assinafy webhook] unknown event type, ignoring:', event);
  }

  // Always ACK
  return NextResponse.json({ received: true });
}
