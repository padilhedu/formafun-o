/**
 * POST /api/configuracoes/templates/upload
 *
 * Recebe um arquivo .docx (ou .pdf estático) + metadados via multipart/form-data,
 * salva no Supabase Storage, extrai placeholders e cria/atualiza o registro
 * em contratos_templates.
 *
 * Campos do form:
 *   nome              string   (obrigatório)
 *   tipo              string   (obrigatório)
 *   categoria_documento string (obrigatório: 'contrato' | 'tcle')
 *   arquivo_estatico  'true' | 'false'
 *   template_id       string?  (se preenchido, cria nova versão substituindo o template)
 *   arquivo           File     (obrigatório: .docx ou .pdf se estático)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractPlaceholders, fillDocxTemplate, SAMPLE_DATA, docxToText } from '@/lib/docx-generator';
import { generateContractPdfFromData } from '@/lib/pdf-generator';

const ALLOWED_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const BUCKET = 'templates-originais';

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Corpo inválido — use multipart/form-data' }, { status: 400 });
  }

  const nome = form.get('nome') as string | null;
  const tipo = (form.get('tipo') as string | null) ?? 'prestacao_servico';
  const categDoc = (form.get('categoria_documento') as string | null) ?? 'contrato';
  const arquivoEstatico = form.get('arquivo_estatico') === 'true';
  const templateIdExistente = form.get('template_id') as string | null;
  const arquivo = form.get('arquivo') as File | null;

  if (!nome) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
  if (!arquivo) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 });

  const isPdf = arquivo.type === 'application/pdf';
  const isDocx = arquivo.type === ALLOWED_DOCX
    || arquivo.name.endsWith('.docx');

  // Rejeitar PDF sem flag estático
  if (isPdf && !arquivoEstatico) {
    return NextResponse.json({
      error: 'PDFs só são aceitos como documentos estáticos (sem placeholders). '
        + 'Para documentos com dados variáveis do paciente, converta o arquivo para .docx: '
        + 'abra o PDF no Word → Arquivo → Salvar como → .docx, insira os campos '
        + '{{paciente_nome}}, {{paciente_cpf}} etc. e envie o .docx.',
    }, { status: 422 });
  }

  if (!isDocx && !isPdf) {
    return NextResponse.json({ error: 'Formato não suportado. Envie um arquivo .docx ou .pdf.' }, { status: 422 });
  }

  const fileBuffer = Buffer.from(await arquivo.arrayBuffer());
  const ext = isPdf ? 'pdf' : 'docx';
  const arquivoTipo = isPdf ? 'pdf' : 'docx';

  // Gerar ID para o template antes do upload
  const templateId = crypto.randomUUID();
  const storagePath = `${templateId}/original.${ext}`;

  // Upload do arquivo original
  const { error: uploadErr } = await sb.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: arquivo.type,
      upsert: false,
    });

  if (uploadErr) {
    // Se bucket não existe, tentar criar e reenviar
    if (uploadErr.message?.includes('Bucket not found') || uploadErr.message?.includes('bucket')) {
      // O bucket precisa ser criado via Supabase Dashboard ou CLI
      return NextResponse.json({
        error: `Bucket "${BUCKET}" não encontrado. Crie-o no Supabase Dashboard (Storage > New Bucket) com o nome "templates-originais" e tente novamente.`,
      }, { status: 500 });
    }
    return NextResponse.json({ error: `Erro ao salvar arquivo: ${uploadErr.message}` }, { status: 500 });
  }

  const { data: signedData } = await sb.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 ano
  const arquivoUrl = signedData?.signedUrl ?? null;

  // Extrair placeholders (só para .docx)
  let placeholders: string[] = [];
  if (!arquivoEstatico && isDocx) {
    placeholders = extractPlaceholders(fileBuffer);
  }

  // Gerar preview PDF (não-bloqueante — falha silenciosa)
  let previewPdfUrl: string | null = null;
  if (!arquivoEstatico && isDocx) {
    try {
      const filledDocx = fillDocxTemplate(fileBuffer, SAMPLE_DATA);
      const texto = await docxToText(filledDocx);
      if (texto) {
        const pdfBuf = await generateContractPdfFromData({
          clinicaNome: SAMPLE_DATA.clinica_nome,
          clinicaCnpj: SAMPLE_DATA.clinica_cnpj,
          clinicaEndereco: SAMPLE_DATA.clinica_endereco,
          clinicaCidade: SAMPLE_DATA.cidade,
          dentistaNome: SAMPLE_DATA.dentista_nome,
          dentistaCro: SAMPLE_DATA.dentista_cro,
          pacienteNome: SAMPLE_DATA.paciente_nome,
          pacienteCpf: SAMPLE_DATA.paciente_cpf,
          pacienteEmail: SAMPLE_DATA.paciente_email,
          pacienteTelefone: SAMPLE_DATA.paciente_telefone,
          pacienteEndereco: SAMPLE_DATA.paciente_endereco,
          orcamentoCodigo: SAMPLE_DATA.orcamento_codigo,
          dataOrcamento: SAMPLE_DATA.data_orcamento,
          validadeOrcamento: SAMPLE_DATA.validade_orcamento,
          valorTotal: SAMPLE_DATA.valor_total,
          condicoesPagamento: SAMPLE_DATA.condicoes_pagamento,
          clausulasAdicionais: SAMPLE_DATA.clausulas_adicionais,
          dataGeracao: SAMPLE_DATA.data_geracao,
          itens: SAMPLE_DATA.itens.map(i => ({
            descricao: i.descricao,
            dente: i.dente,
            face: null,
            qtde: parseInt(i.qtd, 10),
            valor: parseFloat(i.valor.replace(/[^0-9,]/g, '').replace(',', '.')),
            total: parseFloat(i.total.replace(/[^0-9,]/g, '').replace(',', '.')),
          })),
          corpoHtml: texto,
          contratoTitulo: nome,
        });
        const previewPath = `${templateId}/preview.pdf`;
        const { error: previewErr } = await sb.storage
          .from(BUCKET)
          .upload(previewPath, pdfBuf, { contentType: 'application/pdf', upsert: true });
        if (!previewErr) {
          const { data: previewSigned } = await sb.storage
            .from(BUCKET)
            .createSignedUrl(previewPath, 60 * 60 * 24 * 365);
          previewPdfUrl = previewSigned?.signedUrl ?? null;
        }
      }
    } catch {
      // Preview falhou — não bloquear salvamento do template
    }
  }

  // Arquivar versão anterior se for substituição
  if (templateIdExistente) {
    await sb.from('contratos_templates').update({ vigente: false }).eq('id', templateIdExistente);
  }

  // Criar registro do template
  const { data: tmpl, error: insertErr } = await sb
    .from('contratos_templates')
    .insert({
      id: templateId,
      nome,
      tipo,
      categoria_documento: categDoc,
      origem: 'juridico',
      versao: 1,
      vigente: true,
      ativo: true,
      corpo_html: null,
      arquivo_original_url: arquivoUrl,
      arquivo_tipo: arquivoTipo,
      placeholders_detectados: placeholders.length > 0 ? placeholders : null,
      preview_pdf_url: previewPdfUrl,
      arquivo_estatico: arquivoEstatico,
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  await sb.from('audit_log').insert({
    usuario_id: user.id,
    usuario_email: user.email,
    acao: 'upload_template',
    tabela: 'contratos_templates',
    registro_id: templateId,
    dados: { nome, tipo, arquivo_tipo: arquivoTipo, placeholders },
  });

  const avisoPlaceholders = !arquivoEstatico && placeholders.length === 0
    ? 'Nenhum placeholder detectado no documento. Verifique se os campos estão no formato {{campo_nome}} e sem formatação dividida pelo Word.'
    : null;

  return NextResponse.json({
    template: tmpl,
    placeholders,
    preview_pdf_url: previewPdfUrl,
    aviso: avisoPlaceholders,
  }, { status: 201 });
}
