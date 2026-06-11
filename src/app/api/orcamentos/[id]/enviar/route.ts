import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: orc } = await supabase
    .from('orcamentos')
    .select('id, codigo, status, travado, token_publico, pacientes(nome, email)')
    .eq('id', id)
    .single();

  if (!orc) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  if (orc.travado) return NextResponse.json({ error: 'Orçamento travado' }, { status: 400 });

  const paciente = (orc as unknown as { pacientes: { nome: string; email: string | null } | null }).pacientes;
  const email = paciente?.email;

  if (!email) {
    return NextResponse.json({ error: 'Paciente sem e-mail cadastrado' }, { status: 400 });
  }

  const linkPublico = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/p/${(orc as { token_publico: string }).token_publico}`;

  // Tenta enviar via Supabase Auth (email do sistema)
  // Em produção: usar Resend, SendGrid, ou similar via Edge Function
  // Por ora: registra no audit_log e retorna o link
  await supabase.from('orcamento_historico').insert({
    orcamento_id: id,
    evento: 'enviado',
    detalhes: { email, link: linkPublico },
    usuario_id: user.id,
  });

  await supabase.from('audit_log').insert({
    usuario_id: user.id,
    usuario_email: user.email,
    acao: 'orcamento_enviado',
    tabela: 'orcamentos',
    registro_id: id,
    detalhes: { email, codigo: (orc as { codigo: string }).codigo },
  });

  return NextResponse.json({ ok: true, email, link: linkPublico });
}
