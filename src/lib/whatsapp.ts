export function whatsappConfigured() {
  return !!(process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN);
}

function limparTelefone(tel: string) {
  const digits = tel.replace(/\D/g, '');
  // Garantir DDI 55 (Brasil)
  return digits.startsWith('55') ? digits : `55${digits}`;
}

export async function enviarMensagemWhatsApp(telefone: string, mensagem: string) {
  if (!whatsappConfigured()) {
    console.log('[WhatsApp dev-mode] Para:', telefone, '\nMensagem:', mensagem);
    return { _dev_mode: true, message: 'WHATSAPP_API_URL/TOKEN ausente — mensagem não enviada (modo dev)' };
  }

  const url = process.env.WHATSAPP_API_URL!.replace(/\/$/, '');
  const token = process.env.WHATSAPP_API_TOKEN!;
  const numero = limparTelefone(telefone);

  const res = await fetch(`${url}/message/sendText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ number: numero, text: mensagem }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp API error ${res.status}: ${err}`);
  }

  return await res.json();
}

export function mensagemConfirmacao(opts: {
  pacienteNome: string;
  titulo: string;
  inicio: string;
}) {
  const data = new Date(opts.inicio);
  const dtStr = data.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
    timeZone: 'America/Sao_Paulo',
  });
  const hrStr = data.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });

  return (
    `Olá, ${opts.pacienteNome}! 👋\n\n` +
    `Sua consulta *${opts.titulo}* está agendada para:\n` +
    `📅 ${dtStr} às ${hrStr}\n\n` +
    `Clínica Forma & Função — Balneário Camboriú/SC\n` +
    `Responda *1* para confirmar ou *2* para cancelar.`
  );
}
