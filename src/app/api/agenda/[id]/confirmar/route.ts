import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { enviarMensagemWhatsApp, mensagemConfirmacao } from '@/lib/whatsapp';

async function sb() {
  const c = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => c.getAll(), setAll: () => {} } }
  );
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await sb();

  const { data: evento, error } = await client
    .from('agenda_eventos').select('*, pacientes(nome, telefone)').eq('id', id).single();

  if (error || !evento) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });

  const telefone = evento.pacientes?.telefone;
  if (!telefone) return NextResponse.json({ error: 'Paciente sem telefone cadastrado' }, { status: 400 });

  const mensagem = mensagemConfirmacao({
    pacienteNome: evento.pacientes.nome, titulo: evento.titulo, inicio: evento.inicio,
  });

  try {
    const result = await enviarMensagemWhatsApp(telefone, mensagem);
    await client.from('agenda_eventos').update({ whatsapp_enviado: true }).eq('id', id);
    return NextResponse.json({ ok: true, whatsapp: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
