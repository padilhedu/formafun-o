import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validarCPF, mascararCPF } from '@/lib/cpf';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateSignedPdf } from '@/lib/pdf-assinado';
import { enviarEmailContratoAssinado } from '@/lib/email-resend';
import { getSigningSecret } from '@/lib/signing-secret';
import { enviarArquivoParaDrive } from '@/lib/google-drive';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'desconhecido';

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 });

  const { token, nome, cpf, data_nascimento, email, signature_png_base64, lat, lng } = body;

  if (!token || !nome || !cpf || !data_nascimento || !signature_png_base64) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
  }

  // Rate limiting por IP
  const allowed = await checkRateLimit(ip, token);
  if (!allowed) return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 });

  // Validar CPF
  if (!validarCPF(cpf)) {
    return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
  }

  // Validar maioridade (≥18 anos)
  const nascimento = new Date(data_nascimento);
  const limite = new Date();
  limite.setFullYear(limite.getFullYear() - 18);
  if (isNaN(nascimento.getTime()) || nascimento > limite) {
    return NextResponse.json({ error: 'Signatário deve ter 18 anos ou mais' }, { status: 400 });
  }

  // Validar assinatura não em branco (checar presença de dados base64)
  if (!signature_png_base64.startsWith('data:image/png;base64,') || signature_png_base64.length < 200) {
    return NextResponse.json({ error: 'Assinatura inválida ou em branco' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: c } = await supabase
    .from('contratos')
    .select(`
      id, codigo, status, sign_token, sign_token_exp, sign_token_hmac, doc_hash, paciente_id,
      orcamento_id, template_id,
      pacientes(nome, email),
      contratos_templates(nome, corpo_html)
    `)
    .eq('sign_token', token)
    .single();

  if (!c) return NextResponse.json({ error: 'Link inválido' }, { status: 401 });
  if (c.status === 'assinado') return NextResponse.json({ error: 'Contrato já assinado' }, { status: 400 });
  if (c.status === 'recusado') return NextResponse.json({ error: 'Contrato recusado' }, { status: 400 });

  // Verificar expiração
  if (!c.sign_token_exp || new Date(c.sign_token_exp) < new Date()) {
    return NextResponse.json({ error: 'Link expirado' }, { status: 401 });
  }

  // Verificar HMAC
  const secret = getSigningSecret();
  const expectedHmac = crypto.createHmac('sha256', secret).update(token).digest('hex');
  const hmacOk = crypto.timingSafeEqual(Buffer.from(expectedHmac, 'hex'), Buffer.from(c.sign_token_hmac ?? '', 'hex'));
  if (!hmacOk) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });

  type Pac = { nome: string; email: string | null };
  type Tmpl = { nome: string; corpo_html: string };
  const paciente = (c as unknown as { pacientes: Pac }).pacientes;
  const tmpl = (c as unknown as { contratos_templates: Tmpl | null }).contratos_templates;

  // Buscar HTML original do Storage
  const { data: htmlData } = await supabase.storage
    .from('contratos-html')
    .download(`${c.id}/original.html`);
  const originalHtml = htmlData ? await htmlData.text() : (tmpl?.corpo_html ?? '');

  const agora = new Date();
  const agoraStr = agora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'full', timeStyle: 'long' });
  const userAgent = req.headers.get('user-agent') ?? 'desconhecido';

  // Carregar config da clínica
  const { data: cfgData } = await supabase.from('configuracoes').select('valor').eq('chave', 'clinica').single();
  const clinica = (cfgData?.valor as { nome?: string; cnpj?: string; email?: string } | null) ?? {};

  // Gerar PDF assinado
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateSignedPdf({
      clinicaNome: clinica.nome ?? 'Clínica Odontológica',
      clinicaCnpj: clinica.cnpj ?? '',
      contratoTitulo: tmpl?.nome ?? 'Contrato',
      corpoHtml: originalHtml,
      evidencias: {
        signerNome: nome,
        signerCpfMascarado: mascararCPF(cpf),
        assinadoEm: agoraStr,
        signerIp: ip,
        signerUserAgent: userAgent,
        docHash: c.doc_hash ?? '',
        signaturePng: signature_png_base64,
      },
    });
  } catch (e) {
    console.error('Erro ao gerar PDF:', e);
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 });
  }

  // Salvar PDF no Storage via service role (chamada pública não tem sessão de usuário)
  const pdfPath = `${c.paciente_id}/${c.codigo}-assinado.pdf`;
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient: createServiceClient } = await import('@supabase/supabase-js');
      const adminStorage = createServiceClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const { error: pdfUploadErr } = await adminStorage.storage
        .from('contratos-assinados')
        .upload(pdfPath, pdfBuffer, { contentType: 'application/pdf', upsert: true });
      if (pdfUploadErr) console.error('[assinar] Falha no upload do PDF:', pdfUploadErr.message);
    } catch (e) {
      console.error('[assinar] Exceção no upload PDF:', e);
    }
  }

  // Enviar PDF para o Google Drive (não-bloqueante — falha vai para fila)
  let driveFileUrl: string | null = null;
  let driveFolderUrl: string | null = null;
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    try {
      const driveRes = await enviarArquivoParaDrive({
        pacienteNome: paciente?.nome ?? nome,
        pacienteCpf: cpf,
        arquivoBuffer: pdfBuffer,
        nomeArquivo: `${c.codigo}-assinado.pdf`,
        subpasta: '05-Contratos',
        mimeType: 'application/pdf',
      });
      driveFileUrl   = driveRes.fileUrl;
      driveFolderUrl = driveRes.folderUrl;
    } catch (driveErr) {
      console.error('[assinar] Falha ao enviar para o Drive, adicionando à fila:', driveErr);
      // Adicionar à fila de reenvio — não bloqueia o fluxo de assinatura
      try {
        const { createClient: createServiceClient } = await import('@supabase/supabase-js');
        const supabaseUrl2 = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const admin2 = createServiceClient(supabaseUrl2, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        await admin2.from('drive_upload_queue').insert({
          tipo:          'contrato',
          referencia_id: c.id,
          paciente_id:   c.paciente_id,
          paciente_nome: paciente?.nome ?? nome,
          paciente_cpf:  cpf,
          subpasta:      '05-Contratos',
          nome_arquivo:  `${c.codigo}-assinado.pdf`,
          mime_type:     'application/pdf',
          storage_path:  pdfPath,
          status:        'pendente',
          erro_detalhe:  driveErr instanceof Error ? driveErr.message : String(driveErr),
        });
      } catch (qErr) {
        console.error('[assinar] Falha ao enfileirar reenvio Drive:', qErr);
      }
    }
  }

  // Atualizar contrato no banco
  await supabase.from('contratos').update({
    status: 'assinado',
    assinado_em: agora.toISOString(),
    signer_nome: nome,
    signer_cpf: cpf,
    signer_ip: ip,
    signer_user_agent: userAgent,
    signer_lat: lat ?? null,
    signer_lng: lng ?? null,
    signature_svg: signature_png_base64,
    pdf_signed_url: pdfPath,
    drive_file_url:   driveFileUrl,
    drive_folder_url: driveFolderUrl,
    travado: true,
  }).eq('id', c.id);

  // Travar orçamento
  if (c.orcamento_id) {
    await supabase.from('orcamentos').update({ travado: true }).eq('id', c.orcamento_id);
  }

  // Registrar no audit_log
  await supabase.from('audit_log').insert({
    tabela: 'contratos',
    registro_id: c.id,
    acao: 'assinatura_eletronica',
    usuario_id: null,
    detalhes: { signer_nome: nome, signer_ip: ip, doc_hash: c.doc_hash },
  }).then(() => {});

  // Notificação interna para admin/recepcao
  const { data: staffUsers } = await supabase.from('profiles').select('id').in('role', ['admin', 'recepcao']);
  if (staffUsers?.length) {
    await supabase.from('notificacoes').insert(
      staffUsers.map(u => ({
        usuario_id: u.id,
        tipo: 'success',
        titulo: `Contrato ${c.codigo} assinado`,
        corpo: `Assinado por ${nome} (IP: ${ip})`,
      }))
    );
  }

  // Enviar e-mails (se Resend configurado)
  const pacienteEmail = email || paciente?.email;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  if (process.env.RESEND_API_KEY && pacienteEmail && clinica.email) {
    try {
      await enviarEmailContratoAssinado({
        pacienteEmail,
        pacienteNome: paciente?.nome ?? nome,
        clinicaEmail: clinica.email,
        clinicaNome: clinica.nome ?? 'Clínica',
        contratoCodigo: c.codigo,
        contratoId: c.id,
        pdfBuffer,
        appUrl,
      });
    } catch (e) {
      console.error('Erro ao enviar e-mail:', e);
    }
  }

  return NextResponse.json({ success: true });
}
