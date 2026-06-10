import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/portal/login', req.url));

  const formData = await req.formData();
  const eventoId = formData.get('evento_id') as string;
  if (!eventoId) return NextResponse.redirect(new URL('/portal', req.url));

  // Verify event belongs to this patient
  const { data: acesso } = await sb.from('portal_acessos').select('paciente_id').eq('user_id', user.id).single();
  if (!acesso) return NextResponse.redirect(new URL('/portal', req.url));

  const { data: evento } = await sb.from('agenda_eventos').select('paciente_id').eq('id', eventoId).single();
  if (!evento || evento.paciente_id !== acesso.paciente_id) return NextResponse.redirect(new URL('/portal', req.url));

  await sb.from('agenda_eventos').update({ status: 'confirmado' }).eq('id', eventoId);

  // Audit
  await sb.from('audit_log').insert({
    usuario_id: user.id, usuario_email: user.email,
    acao: 'portal_confirmar_consulta', tabela: 'agenda_eventos', registro_id: eventoId,
  });

  return NextResponse.redirect(new URL('/portal', req.url));
}
