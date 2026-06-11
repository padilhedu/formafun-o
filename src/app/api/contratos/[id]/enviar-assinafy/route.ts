import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { assinafyFetch, extractSignUrl, type AsssinafyDoc } from '@/lib/assinafy';
import { generateContractPdf } from '@/lib/pdf-generator';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  // Verify role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile as { role?: string } | null)?.role;
  if (role !== 'admin' && role !== 'recepcao') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  // Load contract
  const { data: contrato } = await supabase
    .from('contratos')
    .select('*, pacientes(nome, email, cpf, telefone)')
    .eq('id', id)
    .single();

  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });

  const c = contrato as {
    id: string; codigo: string; status: string; sign_url: string | null; external_id: string | null;
    pacientes: { nome: string; email: string | null; cpf: string | null } | null;
  };

  // Idempotência: já enviado com link
  if (c.status !== 'rascunho' && c.sign_url) {
    return NextResponse.json({ ok: true, sign_url: c.sign_url, already_sent: true }, { status: 200 });
  }
  if (c.status !== 'rascunho') {
    return NextResponse.json({ error: `Contrato está com status "${c.status}" — não pode ser enviado` }, { status: 409 });
  }

  const paciente = c.pacientes;
  if (!paciente?.email) {
    return NextResponse.json({ error: 'Paciente sem e-mail cadastrado. Adicione o e-mail no cadastro do paciente.' }, { status: 422 });
  }

  // 1. Gerar PDF
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateContractPdf(id);
  } catch (err) {
    console.error('[PDF generation error]', err);
    return NextResponse.json({ error: `Falha ao gerar PDF: ${String(err)}` }, { status: 422 });
  }

  if (!pdfBuffer || pdfBuffer.length < 100) {
    return NextResponse.json({ error: 'PDF gerado está vazio' }, { status: 422 });
  }

  // 2. Verificar env vars Assinafy
  if (!process.env.ASSINAFY_EMAIL || !process.env.ASSINAFY_PASSWORD) {
    // Dev mode: mark sent without real integration
    const { data: updated } = await supabase
      .from('contratos')
      .update({ status: 'enviado', enviado_em: new Date().toISOString() })
      .eq('id', id).select().single();
    return NextResponse.json({ ...updated, _dev_mode: true, sign_url: null });
  }

  // 3. Upload PDF para Assinafy
  const base64Pdf = pdfBuffer.toString('base64');
  const cpfDigits = (paciente.cpf ?? '').replace(/\D/g, '');

  const docPayload = {
    name: `${c.codigo} — ${paciente.nome}`,
    file: base64Pdf,
    external_id: c.id,
    signers: [
      {
        name: paciente.nome,
        email: paciente.email,
        cpf: cpfDigits || undefined,
        send_email: true,
      },
    ],
  };

  let docData: AsssinafyDoc;
  try {
    const res = await assinafyFetch('/documents', {
      method: 'POST',
      body: JSON.stringify(docPayload),
    });

    const raw = await res.json() as Record<string, unknown>;
    console.log('[Assinafy create document response]', JSON.stringify(raw, null, 2));

    if (!res.ok) {
      return NextResponse.json({ error: `Assinafy error (${res.status}): ${JSON.stringify(raw)}` }, { status: 502 });
    }

    // Handle both { id, signers } and { data: { id, signers } } shapes
    docData = (raw.data ?? raw) as AsssinafyDoc;
  } catch (err) {
    return NextResponse.json({ error: `Falha ao conectar Assinafy: ${String(err)}` }, { status: 503 });
  }

  const docId = docData.id;
  const signer = docData.signers?.[0];
  const signerId = signer?.id ?? null;
  const signUrl = signer ? extractSignUrl(signer) : null;

  // 4. Salvar no banco
  await supabase.from('contratos').update({
    status: 'enviado',
    enviado_em: new Date().toISOString(),
    assinafy_doc_id: docId,
    assinafy_signer_id: signerId,
    sign_url: signUrl,
    external_id: c.id,
  }).eq('id', id);

  // 5. Histórico + audit
  await supabase.from('orcamento_historico' as never, /* contratos_historico if exists */).insert({
    orcamento_id: null,
    evento: 'contrato_enviado_assinafy',
    detalhes: { contrato_id: id, doc_id: docId, signer_id: signerId },
    usuario_id: user.id,
  }).maybeSingle();

  await supabase.from('audit_log').insert({
    usuario_id: user.id,
    usuario_email: user.email,
    acao: 'contrato_enviado',
    tabela: 'contratos',
    registro_id: id,
    detalhes: { assinafy_doc_id: docId },
  });

  return NextResponse.json({ ok: true, sign_url: signUrl, assinafy_doc_id: docId });
}
