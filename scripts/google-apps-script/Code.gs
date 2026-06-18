/**
 * Forma & Função — Integração Google Drive via Apps Script
 *
 * Implante este script em script.google.com como "App da Web":
 *   - Executar como: Eu (sua conta Google)
 *   - Acesso: Qualquer pessoa (a segurança vem do WEBHOOK_SECRET no payload)
 *
 * Após implantar, configure as Propriedades do script (engrenagem → Propriedades do script):
 *   WEBHOOK_SECRET = (valor de DRIVE_WEBHOOK_SECRET — nunca commitar aqui)
 *   ROOT_FOLDER_ID = (ID da pasta raiz no Drive)
 */

var SUBPASTAS_PADRAO = [
  '01-Documentos',
  '02-Radiografias',
  '03-Fotos',
  '04-Exames',
  '05-Contratos',
];

/**
 * Recebe POST do sistema Forma & Função e salva o arquivo no Drive.
 * Payload JSON esperado:
 *   secret, paciente_nome, paciente_cpf, arquivo_base64,
 *   nome_arquivo, subpasta, mime_type
 */
function doPost(e) {
  try {
    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (_) {
      return responderErro('Body nao e JSON valido', 400);
    }

    // Validar segredo
    var props = PropertiesService.getScriptProperties();
    var secretEsperado = props.getProperty('WEBHOOK_SECRET');
    if (!secretEsperado || body.secret !== secretEsperado) {
      return responderErro('Segredo invalido ou ausente', 401);
    }

    var pacienteNome = body.paciente_nome;
    var pacienteCpf  = body.paciente_cpf;
    var base64       = body.arquivo_base64;
    var nomeArquivo  = body.nome_arquivo;
    var subpasta     = body.subpasta;
    var mimeType     = body.mime_type || 'application/octet-stream';

    if (!pacienteNome || !pacienteCpf || !base64 || !nomeArquivo || !subpasta) {
      return responderErro('Campos obrigatorios ausentes', 400);
    }

    var cpf = pacienteCpf.replace(/\D/g, '');

    var rootFolderId = props.getProperty('ROOT_FOLDER_ID');
    if (!rootFolderId) {
      return responderErro('ROOT_FOLDER_ID nao configurado', 500);
    }

    var resultado    = buscarOuCriarPastaPaciente(rootFolderId, cpf, pacienteNome, subpasta);
    var pastaPaciente = resultado.pastaPaciente;
    var subpastaRef   = resultado.subpastaRef;

    var bytes   = Utilities.base64Decode(base64);
    var blob    = Utilities.newBlob(bytes, mimeType, nomeArquivo);
    var arquivo = subpastaRef.createFile(blob);

    return responderSucesso({
      sucesso:    true,
      file_id:    arquivo.getId(),
      file_url:   arquivo.getUrl(),
      folder_url: pastaPaciente.getUrl(),
    });

  } catch (err) {
    return responderErro('Erro interno: ' + (err.message || String(err)), 500);
  }
}

/** Confirmação simples para teste via navegador (GET). */
function doGet() {
  return ContentService
    .createTextOutput('Apps Script ativo — use POST para enviar arquivos')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Busca ou cria a pasta "{cpf} - {nome}" dentro da pasta raiz,
 * garante as 5 subpastas padrão e retorna a subpasta solicitada.
 */
function buscarOuCriarPastaPaciente(rootFolderId, cpf, nome, subpastaSolicitada) {
  var rootFolder    = DriveApp.getFolderById(rootFolderId);
  var nomePasta     = cpf + ' - ' + nome;
  var pastaPaciente = null;

  var iter = rootFolder.getFolders();
  while (iter.hasNext()) {
    var p = iter.next();
    if (p.getName().indexOf(cpf) === 0) {
      pastaPaciente = p;
      break;
    }
  }

  if (!pastaPaciente) {
    pastaPaciente = rootFolder.createFolder(nomePasta);
  }

  // Garantir subpastas padrão
  for (var i = 0; i < SUBPASTAS_PADRAO.length; i++) {
    var nomeSub  = SUBPASTAS_PADRAO[i];
    var subExiste = false;
    var iterSub  = pastaPaciente.getFolders();
    while (iterSub.hasNext()) {
      if (iterSub.next().getName() === nomeSub) { subExiste = true; break; }
    }
    if (!subExiste) pastaPaciente.createFolder(nomeSub);
  }

  // Localizar subpasta alvo
  var subpastaRef = null;
  var iterAlvo    = pastaPaciente.getFolders();
  while (iterAlvo.hasNext()) {
    var s = iterAlvo.next();
    if (s.getName() === subpastaSolicitada) { subpastaRef = s; break; }
  }
  if (!subpastaRef) subpastaRef = pastaPaciente.createFolder(subpastaSolicitada);

  return { pastaPaciente: pastaPaciente, subpastaRef: subpastaRef };
}

function responderSucesso(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function responderErro(mensagem, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify({ sucesso: false, erro: mensagem, status: statusCode || 500 }))
    .setMimeType(ContentService.MimeType.JSON);
}
