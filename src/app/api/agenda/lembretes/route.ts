import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { enviarMensagemWhatsApp } from '@/lib/whatsapp';

// Chamado pelo Supabase cron (Edge Function) ou manualmente.
// Envia lembretes D-1 (dia anterior) e D-0 (manhã do dia) via WhatsApp.
// Proteção: CRON_SECRET deve ser passado no header Authorization: Bearer <secret>

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function assertCronAuth(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return; // sem secret configurado = permite (dev)
  const auth = req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${secret}`) throw new Error('Unauthorized');
}

function fmtDataPtBr(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
    timeZone: 'America/Sao_Paulo',
  });
}

function fmtHoraPtBr(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

function mensagemLembrete(opts: {
  pacienteNome: string;
  titulo: string;
  inicio: string;
  tipo: 'D1' | 'D0';
}) {
  const data = fmtDataPtBr(opts.inicio);
  const hora = fmtHoraPtBr(opts.inicio);
  if (opts.tipo === 'D1') {
    return (
      `Olá, ${opts.pacienteNome}! 😊\n\n` +
      `*Lembrete de consulta:* seu atendimento *${opts.titulo}* é *amanhã*!\n` +
      `📅 ${data} às *${hora}*\n\n` +
      `Clínica Forma & Função — Balneário Camboriú/SC\n\n` +
      `Responda *1* para confirmar presença ou *2* para cancelar.`
    );
  }
  return (
    `Bom dia, ${opts.pacienteNome}! ☀️\n\n` +
    `Sua consulta *${opts.titulo}* é *hoje* às *${hora}*.\n\n` +
    `Clínica Forma & Função — Balneário Camboriú/SC\n` +
    `Te esperamos! 🦷`
  );
}

export async function POST(req: NextRequest) {
  try {
    assertCronAuth(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = serviceClient();
  const agora = new Date();
  const tz = 'America/Sao_Paulo';

  // Janela D-1: amanhã 00:00 → 23:59 (Brasília)
  const amanha = new Date(agora.toLocaleString('en-US', { timeZone: tz }));
  amanha.setDate(amanha.getDate() + 1);
  const d1Inicio = new Date(amanha); d1Inicio.setHours(0, 0, 0, 0);
  const d1Fim    = new Date(amanha); d1Fim.setHours(23, 59, 59, 999);

  // Janela D-0: hoje 00:00 → 23:59 (Brasília) — só envia no período da manhã
  const hoje = new Date(agora.toLocaleString('en-US', { timeZone: tz }));
  const d0Inicio = new Date(hoje); d0Inicio.setHours(0, 0, 0, 0);
  const d0Fim    = new Date(hoje); d0Fim.setHours(23, 59, 59, 999);

  const resultados: { tipo: string; evento_id: string; telefone: string; ok: boolean; msg?: string }[] = [];

  // ── D-1: eventos de amanhã que ainda não receberam lembrete ──
  const { data: eventosD1 } = await sb
    .from('agenda_eventos')
    .select('id, titulo, inicio, tipo, pacientes(nome, telefone, whatsapp)')
    .gte('inicio', d1Inicio.toISOString())
    .lte('inicio', d1Fim.toISOString())
    .in('status', ['agendado', 'confirmado'])
    .eq('whatsapp_enviado', false);

  for (const ev of (eventosD1 ?? [])) {
    const pac = (ev as unknown as { pacientes?: { nome: string; telefone: string | null; whatsapp: string | null } }).pacientes;
    const telefone = pac?.whatsapp ?? pac?.telefone;
    if (!telefone) continue;
    try {
      const msg = mensagemLembrete({ pacienteNome: pac!.nome, titulo: ev.titulo, inicio: ev.inicio, tipo: 'D1' });
      await enviarMensagemWhatsApp(telefone, msg);
      await sb.from('agenda_eventos').update({ whatsapp_enviado: true }).eq('id', ev.id);
      resultados.push({ tipo: 'D1', evento_id: ev.id, telefone, ok: true });
    } catch (err) {
      resultados.push({ tipo: 'D1', evento_id: ev.id, telefone, ok: false, msg: String(err) });
    }
  }

  // ── D-0: eventos de hoje pela manhã (envia apenas se não confirmado e não enviado ainda) ──
  const { data: eventosD0 } = await sb
    .from('agenda_eventos')
    .select('id, titulo, inicio, tipo, pacientes(nome, telefone, whatsapp)')
    .gte('inicio', d0Inicio.toISOString())
    .lte('inicio', d0Fim.toISOString())
    .eq('status', 'agendado') // só agendado (não confirmado — confirmado já sabe)
    .eq('whatsapp_confirmado', false);

  for (const ev of (eventosD0 ?? [])) {
    const pac = (ev as unknown as { pacientes?: { nome: string; telefone: string | null; whatsapp: string | null } }).pacientes;
    const telefone = pac?.whatsapp ?? pac?.telefone;
    if (!telefone) continue;
    try {
      const msg = mensagemLembrete({ pacienteNome: pac!.nome, titulo: ev.titulo, inicio: ev.inicio, tipo: 'D0' });
      await enviarMensagemWhatsApp(telefone, msg);
      resultados.push({ tipo: 'D0', evento_id: ev.id, telefone, ok: true });
    } catch (err) {
      resultados.push({ tipo: 'D0', evento_id: ev.id, telefone, ok: false, msg: String(err) });
    }
  }

  return NextResponse.json({ ok: true, enviados: resultados.length, resultados });
}

// GET: status do cron (debug)
export async function GET(req: NextRequest) {
  try { assertCronAuth(req); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, whatsapp_configurado: !!(process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN) });
}
