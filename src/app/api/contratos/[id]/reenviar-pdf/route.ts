import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reenviarPdfPaciente } from '@/lib/email-resend';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { data: c } = await supabase
    .from('contratos')
    .select('id, codigo, status, pdf_signed_url, paciente_id, pacientes(nome, email)')
    .eq('id', id)
    .single();

  if (!c || c.status !== 'assinado' || !c.pdf_signed_url) {
    return NextResponse.json({ error: 'PDF não disponível' }, { status: 400 });
  }

  type Pac = { nome: string; email: string | null };
  const paciente = (c as unknown as { pacientes: Pac }).pacientes;
  if (!paciente?.email) return NextResponse.json({ error: 'Paciente sem e-mail cadastrado' }, { status: 400 });

  const { data: pdfData, error: dlErr } = await supabase.storage
    .from('contratos-assinados')
    .download(c.pdf_signed_url);
  if (dlErr || !pdfData) return NextResponse.json({ error: 'Erro ao baixar PDF' }, { status: 500 });

  const pdfBuffer = Buffer.from(await pdfData.arrayBuffer());

  const { data: cfgData } = await supabase.from('configuracoes').select('valor').eq('chave', 'clinica').single();
  const clinica = (cfgData?.valor as { nome?: string } | null) ?? {};

  await reenviarPdfPaciente({
    pacienteEmail: paciente.email,
    pacienteNome: paciente.nome,
    clinicaNome: clinica.nome ?? 'Clínica',
    contratoCodigo: c.codigo,
    contratoId: c.id,
    pdfBuffer,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? '',
  });

  return NextResponse.json({ success: true });
}
