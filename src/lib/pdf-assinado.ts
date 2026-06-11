/**
 * Gera o PDF final do contrato assinado com evidências de assinatura.
 * Usa @react-pdf/renderer (já instalado), sem Puppeteer.
 */
import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, pdf, Font } from '@react-pdf/renderer';

Font.register({ family: 'Helvetica', fonts: [{ src: 'Helvetica' }, { src: 'Helvetica-Bold', fontWeight: 'bold' }] });

const s = StyleSheet.create({
  page:        { fontFamily: 'Helvetica', fontSize: 10, paddingTop: 50, paddingBottom: 50, paddingHorizontal: 50, color: '#1a1a1a', lineHeight: 1.6 },
  header:      { borderBottomWidth: 1, borderBottomColor: '#cccccc', marginBottom: 16, paddingBottom: 8 },
  clinicName:  { fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  clinicSub:   { fontSize: 8, color: '#666666' },
  title:       { fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginBottom: 14, marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 },
  body:        { fontSize: 9.5, lineHeight: 1.7, marginBottom: 10, textAlign: 'justify' },
  evidBox:     { marginTop: 30, padding: 12, borderWidth: 1, borderColor: '#cccccc', backgroundColor: '#f9f9f9' },
  evidTitle:   { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, color: '#333' },
  evidRow:     { flexDirection: 'row', marginBottom: 4 },
  evidLabel:   { width: 140, fontSize: 8.5, color: '#555' },
  evidValue:   { flex: 1, fontSize: 8.5 },
  sigSection:  { marginTop: 16, alignItems: 'center' },
  sigLabel:    { fontSize: 8, color: '#555', textAlign: 'center', marginBottom: 4 },
  sigImg:      { width: 220, height: 80, objectFit: 'contain', border: '0.5 solid #999', backgroundColor: '#fff' },
  disclaimer:  { marginTop: 10, fontSize: 7.5, color: '#777', textAlign: 'center' },
  footer:      { position: 'absolute', bottom: 25, left: 50, right: 50, borderTopWidth: 0.5, borderTopColor: '#cccccc', paddingTop: 4, flexDirection: 'row', justifyContent: 'space-between' },
  footerText:  { fontSize: 7, color: '#999999' },
});

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n').trim();
}

interface EvidenciasParams {
  signerNome: string;
  signerCpfMascarado: string;
  assinadoEm: string;
  signerIp: string;
  signerUserAgent: string;
  docHash: string;
  signaturePng: string;
}

interface PdfAssinadoParams {
  clinicaNome: string;
  clinicaCnpj: string;
  contratoTitulo: string;
  corpoHtml: string;
  evidencias: EvidenciasParams;
}

function DocAssinado({ data }: { data: PdfAssinadoParams }) {
  const { evidencias: ev } = data;
  return React.createElement(Document, null,
    React.createElement(Page, { size: 'A4', style: s.page },
      React.createElement(View, { style: s.header },
        React.createElement(Text, { style: s.clinicName }, data.clinicaNome),
        React.createElement(Text, { style: s.clinicSub }, `CNPJ: ${data.clinicaCnpj}`),
      ),
      React.createElement(Text, { style: s.title }, data.contratoTitulo),
      React.createElement(View, null,
        React.createElement(Text, { style: s.body }, stripHtml(data.corpoHtml)),
      ),
      React.createElement(View, { style: s.evidBox },
        React.createElement(Text, { style: s.evidTitle }, 'Relatório de Evidências de Assinatura'),
        ...[
          ['Signatário',          ev.signerNome],
          ['CPF',                 ev.signerCpfMascarado],
          ['Data e hora',         ev.assinadoEm],
          ['IP do dispositivo',   ev.signerIp],
          ['Dispositivo/Navegador', ev.signerUserAgent],
          ['Hash do documento',   ev.docHash],
          ['Verificação',         'SHA-256 — integridade verificável conforme MP 2.200-2/2001'],
        ].map(([label, value], i) =>
          React.createElement(View, { key: i, style: s.evidRow },
            React.createElement(Text, { style: s.evidLabel }, label + ':'),
            React.createElement(Text, { style: s.evidValue }, value),
          )
        ),
        React.createElement(View, { style: s.sigSection },
          React.createElement(Text, { style: s.sigLabel }, 'Assinatura do signatário:'),
          ev.signaturePng
            ? React.createElement(Image, { style: s.sigImg, src: ev.signaturePng })
            : React.createElement(Text, { style: s.sigLabel }, '[imagem da assinatura]'),
        ),
        React.createElement(Text, { style: s.disclaimer },
          'Este documento possui validade jurídica conforme a Medida Provisória 2.200-2/2001.\n' +
          'O hash SHA-256 acima comprova que o conteúdo não foi alterado após a geração do link de assinatura.'
        ),
      ),
      React.createElement(View, { style: s.footer, fixed: true },
        React.createElement(Text, { style: s.footerText }, `${data.clinicaNome} — Documento assinado eletronicamente`),
        React.createElement(Text, { style: s.footerText, render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `${pageNumber}/${totalPages}` }),
      ),
    )
  );
}

export async function generateSignedPdf(params: PdfAssinadoParams): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instance = pdf(React.createElement(DocAssinado, { data: params }) as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buf: Buffer = await (instance as any).toBuffer();
  return buf;
}
