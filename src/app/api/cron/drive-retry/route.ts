import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { enviarArquivoParaDrive, DriveUploadParams } from '@/lib/google-drive';

const MAX_TENTATIVAS = 5;

export async function GET(req: NextRequest) {
  // Verificar autorização do cron (Vercel envia Authorization: Bearer <CRON_SECRET>)
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const admin = createServiceClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Buscar pendentes com menos de MAX_TENTATIVAS
  const { data: pendentes, error } = await admin
    .from('drive_upload_queue')
    .select('*')
    .eq('status', 'pendente')
    .lt('tentativas', MAX_TENTATIVAS)
    .order('criado_em', { ascending: true })
    .limit(20);

  if (error) {
    console.error('[drive-retry] Erro ao buscar fila:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!pendentes?.length) {
    return NextResponse.json({ processados: 0, mensagem: 'Fila vazia' });
  }

  let enviados = 0;
  let erros = 0;

  for (const item of pendentes) {
    // Buscar o arquivo do Supabase Storage
    let buffer: Buffer;
    try {
      const { data: fileData, error: dlErr } = await admin.storage
        .from(item.tipo === 'contrato' ? 'contratos-assinados' : 'documentos-pacientes')
        .download(item.storage_path);

      if (dlErr || !fileData) throw new Error(dlErr?.message ?? 'Arquivo não encontrado no Storage');

      buffer = Buffer.from(await fileData.arrayBuffer());
    } catch (dlErr) {
      const msg = dlErr instanceof Error ? dlErr.message : String(dlErr);
      await admin.from('drive_upload_queue').update({
        tentativas:   item.tentativas + 1,
        erro_detalhe: `Download Storage: ${msg}`,
        status:       item.tentativas + 1 >= MAX_TENTATIVAS ? 'erro' : 'pendente',
      }).eq('id', item.id);
      erros++;
      continue;
    }

    // Tentar enviar ao Drive
    try {
      const driveParams: DriveUploadParams = {
        pacienteNome:  item.paciente_nome,
        pacienteCpf:   item.paciente_cpf,
        arquivoBuffer: buffer,
        nomeArquivo:   item.nome_arquivo,
        subpasta:      item.subpasta as DriveUploadParams['subpasta'],
        mimeType:      item.mime_type,
      };

      const result = await enviarArquivoParaDrive(driveParams);

      // Marcar como enviado e atualizar referência original
      await admin.from('drive_upload_queue').update({
        status:     'enviado',
        enviado_em: new Date().toISOString(),
        tentativas: item.tentativas + 1,
      }).eq('id', item.id);

      // Persistir URLs no registro original
      if (item.tipo === 'contrato') {
        await admin.from('contratos').update({
          drive_file_url:   result.fileUrl,
          drive_folder_url: result.folderUrl,
        }).eq('id', item.referencia_id);
      } else {
        await admin.from('documentos_paciente').update({
          drive_file_id:   result.fileId,
          drive_file_url:  result.fileUrl,
          drive_folder_url: result.folderUrl,
          drive_status:    'enviado',
        }).eq('id', item.referencia_id);
      }

      enviados++;
    } catch (sendErr) {
      const msg = sendErr instanceof Error ? sendErr.message : String(sendErr);
      const novasTentativas = item.tentativas + 1;
      await admin.from('drive_upload_queue').update({
        tentativas:   novasTentativas,
        erro_detalhe: msg,
        status:       novasTentativas >= MAX_TENTATIVAS ? 'erro' : 'pendente',
      }).eq('id', item.id);

      // Notificar admin se atingiu limite de tentativas
      if (novasTentativas >= MAX_TENTATIVAS) {
        const { data: admins } = await admin.from('profiles').select('id').eq('role', 'admin');
        if (admins?.length) {
          await admin.from('notificacoes').insert(admins.map(u => ({
            usuario_id: u.id,
            tipo:       'error',
            titulo:     'Falha permanente no envio ao Drive',
            corpo:      `Arquivo "${item.nome_arquivo}" do paciente ${item.paciente_nome} não pôde ser enviado após ${MAX_TENTATIVAS} tentativas. Verificar manualmente.`,
          })));
        }
      }
      erros++;
    }
  }

  return NextResponse.json({ processados: pendentes.length, enviados, erros });
}
