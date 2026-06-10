import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Load contract with patient data
  const { data: contrato, error: cErr } = await supabase
    .from('contratos')
    .select('*, pacientes(nome, email, telefone)')
    .eq('id', id)
    .single();

  if (cErr || !contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });
  if ((contrato as { status: string }).status === 'assinado') {
    return NextResponse.json({ error: 'Contrato já assinado' }, { status: 400 });
  }

  const zapsignToken = process.env.ZAPSIGN_API_TOKEN;
  if (!zapsignToken) {
    // Dev mode: mark as sent without ZapSign
    const { data } = await supabase
      .from('contratos')
      .update({ status: 'enviado', enviado_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return NextResponse.json({ ...data, _dev_mode: true, message: 'ZAPSIGN_API_TOKEN não configurado — contrato marcado como enviado sem integração real.' });
  }

  // Build the public URL for the rendered contract HTML
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.headers.get('origin') ?? '';
  const contratoUrl = `${appUrl}/api/contratos/${id}/pdf?token=${(contrato as { token_publico: string }).token_publico}`;

  const paciente = (contrato as { pacientes: { nome: string; email: string | null; telefone: string | null } }).pacientes;

  // ZapSign: create document
  const zapsignPayload = {
    name: `${(contrato as { codigo: string }).codigo} — ${paciente.nome}`,
    url_pdf: contratoUrl,
    signers: [
      {
        name: paciente.nome,
        email: paciente.email ?? '',
        phone_country: '55',
        phone_number: (paciente.telefone ?? '').replace(/\D/g, ''),
        auth_mode: 'assinaturaTela',
        send_automatic_email: !!paciente.email,
        send_automatic_whatsapp: false,
      },
    ],
  };

  let zapsignDocToken: string | null = null;
  let zapsignDocUrl: string | null = null;

  try {
    const zapsignRes = await fetch('https://api.zapsign.com.br/api/v1/docs/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `api_key ${zapsignToken}`,
      },
      body: JSON.stringify(zapsignPayload),
    });

    if (!zapsignRes.ok) {
      const errBody = await zapsignRes.text();
      return NextResponse.json({ error: `ZapSign error: ${errBody}` }, { status: 502 });
    }

    const zapsignData = await zapsignRes.json() as { token: string; created_at?: string; signers?: { token: string; sign_url: string }[] };
    zapsignDocToken = zapsignData.token;
    zapsignDocUrl = zapsignData.signers?.[0]?.sign_url ?? null;
  } catch (err) {
    return NextResponse.json({ error: `Erro ao conectar ZapSign: ${err}` }, { status: 502 });
  }

  // Update contract
  const { data } = await supabase
    .from('contratos')
    .update({
      status: 'enviado',
      enviado_em: new Date().toISOString(),
      zapsign_doc_token: zapsignDocToken,
      zapsign_doc_url: zapsignDocUrl,
    })
    .eq('id', id)
    .select()
    .single();

  return NextResponse.json({ ...data, sign_url: zapsignDocUrl });
}
