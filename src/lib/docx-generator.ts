/**
 * Módulo para geração de documentos .docx via docxtemplater.
 *
 * Pipeline:
 *  1. Jurídico cria .docx no Word com placeholders {{campo}}
 *  2. fillDocxTemplate() preenche os placeholders com dados reais
 *  3. docxToText() extrai o texto via mammoth para alimentar o PDF
 *
 * NOTA SOBRE CONVERSÃO PDF:
 * libreoffice-convert requer LibreOffice instalado no servidor e não
 * funciona no Vercel Hobby/Pro. O texto extraído via mammoth é usado como
 * corpo do contrato no renderer @react-pdf/renderer (pdf-generator.ts).
 * Para fidelidade 100% ao layout Word, configure DOCX_TO_PDF_API_URL
 * apontando para um serviço externo (ex: CloudConvert, servidor próprio).
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PizZip = require('pizzip');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Docxtemplater = require('docxtemplater');

export interface DocxItem {
  descricao: string;
  dente: string;
  qtd: string;
  valor: string;
  total: string;
}

export interface DocxTemplateData {
  // Paciente
  paciente_nome: string;
  paciente_cpf: string;
  paciente_email: string;
  paciente_telefone: string;
  paciente_endereco: string;
  // Dentista / Clínica
  dentista_nome: string;
  dentista_cro: string;
  clinica_nome: string;
  clinica_cnpj: string;
  clinica_endereco: string;
  cidade: string;
  // Orçamento
  orcamento_codigo: string;
  data_orcamento: string;
  validade_orcamento: string;
  valor_total: string;
  condicoes_pagamento: string;
  clausulas_adicionais: string;
  // Datas
  data_geracao: string;
  // Itens (loop {{#itens}}...{{/itens}})
  itens: DocxItem[];
}

/** Dados de exemplo usados para preview e validação de placeholders */
export const SAMPLE_DATA: DocxTemplateData = {
  paciente_nome: 'Maria Fernanda (Exemplo)',
  paciente_cpf: '000.000.000-00',
  paciente_email: 'paciente@exemplo.com',
  paciente_telefone: '(47) 99999-9999',
  paciente_endereco: 'Rua Exemplo, 123, Centro, Balneário Camboriú/SC',
  dentista_nome: 'Dr(a). Nome do Dentista',
  dentista_cro: 'SC-00000',
  clinica_nome: 'Forma & Função Odontologia',
  clinica_cnpj: '00.000.000/0001-00',
  clinica_endereco: 'Av. Brasil, 456, Centro, Balneário Camboriú/SC',
  cidade: 'Balneário Camboriú',
  orcamento_codigo: 'ORC-2026-00001',
  data_orcamento: '17 de junho de 2026',
  validade_orcamento: '17/07/2026',
  valor_total: 'R$ 5.000,00',
  condicoes_pagamento: '50% na assinatura + 50% em 30 dias',
  clausulas_adicionais: '',
  data_geracao: '17 de junho de 2026',
  itens: [
    { descricao: 'Implante de Titânio', dente: '36', qtd: '1', valor: 'R$ 2.500,00', total: 'R$ 2.500,00' },
    { descricao: 'Coroa de Porcelana',  dente: '36', qtd: '1', valor: 'R$ 2.500,00', total: 'R$ 2.500,00' },
  ],
};

/**
 * Preenche todos os placeholders {{campo}} no .docx com os dados fornecidos.
 * Suporta loop de itens: {{#itens}}...{{/itens}}
 */
export function fillDocxTemplate(docxBuffer: Buffer, data: DocxTemplateData): Buffer {
  const zip = new PizZip(docxBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
  });
  doc.render(data);
  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' }) as Buffer;
}

/**
 * Extrai todos os placeholders {{campo}} encontrados no XML do documento.
 * Não detecta placeholders que o Word tenha dividido entre múltiplos runs
 * de texto (ex: {{pac | iente_nome}}). Instrua o jurídico a usar a
 * opção "Limpar formatação" antes de digitar os placeholders.
 */
export function extractPlaceholders(docxBuffer: Buffer): string[] {
  try {
    const zip = new PizZip(docxBuffer);
    const xml: string = zip.files['word/document.xml']?.asText() ?? '';
    // Remove tags XML e entidades
    const text = xml
      .replace(/<[^>]*>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    const found = new Set<string>();
    const re = /\{\{([#/]?[\w_]+)\}\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const tag = m[1];
      // Exclui abertura/fechamento de loops — só variáveis escalares
      if (!tag.startsWith('#') && !tag.startsWith('/')) {
        found.add(`{{${tag}}}`);
      }
    }
    return Array.from(found).sort();
  } catch {
    return [];
  }
}

/**
 * Converte o buffer .docx para texto simples usando mammoth.
 * Retorna string vazia se mammoth não estiver disponível ou falhar.
 */
export async function docxToText(docxBuffer: Buffer): Promise<string> {
  try {
    // mammoth pode não estar disponível em todos os ambientes
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer: docxBuffer });
    return result.value ?? '';
  } catch {
    return '';
  }
}

/**
 * Converte .docx para PDF usando serviço externo configurado via env.
 * Retorna null se não houver serviço configurado (fallback: react-pdf).
 */
export async function docxToPdfExternal(docxBuffer: Buffer): Promise<Buffer | null> {
  const apiUrl = process.env.DOCX_TO_PDF_API_URL;
  if (!apiUrl) return null;
  try {
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([new Uint8Array(docxBuffer)], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
      'template.docx',
    );
    const res = await fetch(apiUrl, { method: 'POST', body: formData });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}
