import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enviarEmailContratoRecusado } from '@/lib/email-resend';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 });

  const { token, motivo } = body;
  if (!token || !motivo?.trim()) {
    return NextResponse.json({ error: 'Token e motivo são obrigatórios' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: c } = await supabase
    .from('contratos')
    .select('id, codigo, status, sign_token, sign_token_exp, paciente_id, pacientes(nome)')
    .eq('sign_token', token)
    .single();

  if (!c) return NextResponse.json({ error: 'Link inválido' }, { status: 404 });
  if (c.status === 'assinado' || c.status === 'recusado') {
    return NextResponse.json({ error: 'Contrato já processado' }, { status: 400 });
  }
  if (!c.sign_token_exp || new Date(c.sign_token_exp) < new Date()) {
    return NextResponse.json({ error: 'Link expirado' }, { status: 401 });
  }

  type Pac = { nome: string };
  const pacienteNome = (c as unknown as { pacientes: Pac }).pacientes?.nome ?? 'Paciente';

  await supabase.from('contratos').update({
    status: 'recusado',
    recusado_em: new Date().toISOString(),
    recusa_motivo: motivo.trim(),
  }).eq('id', c.id);

  // Notificação interna
  const { data: staffUsers } = await supabase.from('profiles').select('id').in('role', ['admin', 'recepcao']);
  if (staffUsers?.length) {
    await supabase.from('notificacoes').insert(
      staffUsers.map(u => ({
        usuario_id: u.id,
        tipo: 'error',
        titulo: `Contrato ${c.codigo} recusado`,
        corpo: `${pacienteNome} recusou. Motivo: ${motivo.trim()}`,
      }))
    );
  }

  const { data: cfgData } = await supabase.from('configuracoes').select('valor').eq('chave', 'clinica').single();
  const clinica = (cfgData?.valor as { nome?: string; email?: string } | null) ?? {};

  if (process.env.RESEND_API_KEY && clinica.email) {
    try {
      await enviarEmailContratoRecusado({
        clinicaEmail: clinica.email,
        clinicaNome: clinica.nome ?? 'Clínica',
        pacienteNome,
        contratoCodigo: c.codigo,
        contratoId: c.id,
        motivo: motivo.trim(),
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? '',
      });
    } catch (e) {
      console.error('Erro ao enviar e-mail de recusa:', e);
    }
  }

  return NextResponse.json({ success: true });
}
