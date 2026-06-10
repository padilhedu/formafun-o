import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Webhook recebe respostas "1" (confirmar) ou "2" (cancelar) do paciente via WhatsApp
// Compatible com Z-API e Evolution API payload format

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });

  // Normalizar payload Z-API / Evolution API
  const from: string =
    body.phone || body.from || body.sender || body.data?.key?.remoteJid || '';
  const text: string =
    body.text?.message || body.message?.conversation || body.data?.message?.conversation || '';

  const telefone = from.replace(/\D/g, '').replace(/^55/, '');

  if (!telefone || !text) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const resposta = text.trim();
  if (resposta !== '1' && resposta !== '2') {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const sb = serviceClient();

  // Busca evento mais recente do paciente com whatsapp_enviado=true e status=agendado
  const { data: paciente } = await sb
    .from('pacientes')
    .select('id')
    .or(`telefone.ilike.%${telefone}%`)
    .maybeSingle();

  if (!paciente) return NextResponse.json({ ok: true, ignored: true });

  const { data: evento } = await sb
    .from('agenda_eventos')
    .select('id')
    .eq('paciente_id', paciente.id)
    .eq('whatsapp_enviado', true)
    .eq('status', 'agendado')
    .order('inicio')
    .limit(1)
    .maybeSingle();

  if (!evento) return NextResponse.json({ ok: true, ignored: true });

  if (resposta === '1') {
    await sb.from('agenda_eventos').update({
      status: 'confirmado',
      whatsapp_confirmado: true,
    }).eq('id', evento.id);
  } else {
    await sb.from('agenda_eventos').update({
      status: 'cancelado',
    }).eq('id', evento.id);
  }

  return NextResponse.json({ ok: true, evento_id: evento.id, acao: resposta === '1' ? 'confirmado' : 'cancelado' });
}
