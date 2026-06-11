import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailAssinadoParams {
  pacienteEmail: string;
  pacienteNome: string;
  clinicaEmail: string;
  clinicaNome: string;
  contratoCodigo: string;
  contratoId: string;
  pdfBuffer: Buffer;
  appUrl: string;
}

export async function enviarEmailContratoAssinado(p: EmailAssinadoParams) {
  const pdfBase64 = p.pdfBuffer.toString('base64');
  const nomeArquivo = `${p.contratoCodigo}-assinado.pdf`;

  await resend.emails.send({
    from: `${p.clinicaNome} <noreply@${new URL(p.appUrl).hostname}>`,
    to: p.pacienteEmail,
    subject: `Seu contrato está assinado — ${p.clinicaNome}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <h2 style="color:#7c6a3e">Contrato assinado com sucesso</h2>
        <p>Olá, <strong>${p.pacienteNome}</strong>!</p>
        <p>Seu contrato <strong>${p.contratoCodigo}</strong> foi assinado digitalmente.</p>
        <p>O PDF com todas as evidências de assinatura está em anexo.</p>
        <p style="margin-top:24px;color:#666;font-size:13px">
          Em breve nossa equipe entrará em contato.<br/>
          <strong>${p.clinicaNome}</strong>
        </p>
      </div>
    `,
    attachments: [{ filename: nomeArquivo, content: pdfBase64 }],
  });

  await resend.emails.send({
    from: `Sistema CRM <noreply@${new URL(p.appUrl).hostname}>`,
    to: p.clinicaEmail,
    subject: `Contrato assinado: ${p.pacienteNome} — ${p.contratoCodigo}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <h2>Contrato assinado</h2>
        <p>O contrato <strong>${p.contratoCodigo}</strong> foi assinado pelo paciente.</p>
        <p><a href="${p.appUrl}/contratos/${p.contratoId}" style="color:#7c6a3e">Ver no CRM →</a></p>
        <p style="font-size:13px;color:#666">O PDF assinado está em anexo.</p>
      </div>
    `,
    attachments: [{ filename: nomeArquivo, content: pdfBase64 }],
  });
}

interface EmailRecusaParams {
  clinicaEmail: string;
  clinicaNome: string;
  pacienteNome: string;
  contratoCodigo: string;
  contratoId: string;
  motivo: string;
  appUrl: string;
}

export async function enviarEmailContratoRecusado(p: EmailRecusaParams) {
  await resend.emails.send({
    from: `Sistema CRM <noreply@${new URL(p.appUrl).hostname}>`,
    to: p.clinicaEmail,
    subject: `Contrato recusado: ${p.pacienteNome} — ${p.contratoCodigo}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <h2 style="color:#dc2626">Contrato recusado</h2>
        <p>O paciente <strong>${p.pacienteNome}</strong> recusou o contrato <strong>${p.contratoCodigo}</strong>.</p>
        <p><strong>Motivo informado:</strong></p>
        <blockquote style="border-left:3px solid #dc2626;margin:0;padding:8px 16px;background:#fef2f2;color:#7f1d1d">
          ${p.motivo}
        </blockquote>
        <p style="margin-top:16px">
          <a href="${p.appUrl}/contratos/${p.contratoId}" style="color:#7c6a3e">Ver no CRM →</a>
        </p>
      </div>
    `,
  });
}

export async function reenviarPdfPaciente(p: Omit<EmailAssinadoParams, 'clinicaEmail' | 'clinicaNome'> & { clinicaNome: string }) {
  const pdfBase64 = p.pdfBuffer.toString('base64');
  await resend.emails.send({
    from: `${p.clinicaNome} <noreply@${new URL(p.appUrl).hostname}>`,
    to: p.pacienteEmail,
    subject: `Seu contrato — ${p.clinicaNome}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <h2 style="color:#7c6a3e">Cópia do seu contrato</h2>
        <p>Olá, <strong>${p.pacienteNome}</strong>!</p>
        <p>Segue em anexo a cópia do contrato <strong>${p.contratoCodigo}</strong> assinado.</p>
      </div>
    `,
    attachments: [{ filename: `${p.contratoCodigo}-assinado.pdf`, content: pdfBase64 }],
  });
}
