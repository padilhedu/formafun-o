export interface DriveUploadResult {
  fileId: string;
  fileUrl: string;
  folderUrl: string;
}

export interface DriveUploadParams {
  pacienteNome: string;
  pacienteCpf: string;
  arquivoBuffer: Buffer;
  nomeArquivo: string;
  subpasta: '01-Documentos' | '02-Radiografias' | '03-Fotos' | '04-Exames' | '05-Contratos';
  mimeType: string;
}

const LIMITE_BYTES = 10 * 1024 * 1024; // 10 MB — Apps Script aceita ~50 MB mas alertamos antes

export async function enviarArquivoParaDrive(params: DriveUploadParams): Promise<DriveUploadResult> {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  const secret = process.env.DRIVE_WEBHOOK_SECRET;

  if (!url) throw new Error('[Drive] GOOGLE_APPS_SCRIPT_URL não configurada.');
  if (!secret) throw new Error('[Drive] DRIVE_WEBHOOK_SECRET não configurado.');

  if (params.arquivoBuffer.length > LIMITE_BYTES) {
    console.warn(`[Drive] Arquivo grande (${(params.arquivoBuffer.length / 1024 / 1024).toFixed(1)} MB). Apps Script suporta até ~50 MB.`);
  }

  const payload = {
    secret,
    paciente_nome:  params.pacienteNome,
    paciente_cpf:   params.pacienteCpf,
    arquivo_base64: params.arquivoBuffer.toString('base64'),
    nome_arquivo:   params.nomeArquivo,
    subpasta:       params.subpasta,
    mime_type:      params.mimeType,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000); // 45s — Apps Script pode ter cold start

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`[Drive] Falha de rede ao chamar Apps Script: ${msg}`);
  } finally {
    clearTimeout(timeout);
  }

  let json: Record<string, unknown>;
  try {
    json = await res.json();
  } catch {
    throw new Error('[Drive] Resposta inesperada do Apps Script (não é JSON).');
  }

  if (!json.sucesso) {
    throw new Error(`[Drive] Apps Script retornou erro: ${json.erro ?? 'desconhecido'}`);
  }

  return {
    fileId:    String(json.file_id),
    fileUrl:   String(json.file_url),
    folderUrl: String(json.folder_url),
  };
}
