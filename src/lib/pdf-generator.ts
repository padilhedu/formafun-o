/**
 * Server-side PDF generation using @react-pdf/renderer.
 * Renders the contract HTML template with all placeholders substituted.
 */
import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, pdf, Font,
  type DocumentProps,
} from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 50,
    color: '#1a1a1a',
    lineHeight: 1.6,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    marginBottom: 20,
    paddingBottom: 10,
  },
  clinicName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  clinicSub: {
    fontSize: 8,
    color: '#666666',
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#555555',
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dddddd',
    paddingBottom: 3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    width: 120,
    fontSize: 9,
    color: '#666666',
  },
  value: {
    flex: 1,
    fontSize: 10,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.7,
    marginBottom: 10,
    textAlign: 'justify',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderWidth: 0.5,
    borderColor: '#cccccc',
    padding: 5,
    fontWeight: 'bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: '#cccccc',
    padding: 5,
    fontSize: 9,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
  tableCellNarrow: {
    width: 60,
    fontSize: 9,
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 8,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  signature: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sigBlock: {
    alignItems: 'center',
    width: 200,
  },
  sigLine: {
    borderTopWidth: 0.5,
    borderTopColor: '#333333',
    width: 180,
    marginBottom: 5,
  },
  sigLabel: {
    fontSize: 8,
    color: '#555555',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    borderTopWidth: 0.5,
    borderTopColor: '#cccccc',
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#999999',
  },
  clausulas: {
    fontSize: 9,
    lineHeight: 1.6,
    backgroundColor: '#f9f9f9',
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#cccccc',
  },
});

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface ContractData {
  clinicaNome: string;
  clinicaCnpj: string;
  clinicaEndereco: string;
  clinicaCidade: string;
  dentistaNome: string;
  dentistaCro: string;
  pacienteNome: string;
  pacienteCpf: string;
  pacienteEmail: string;
  pacienteTelefone: string;
  pacienteEndereco: string;
  orcamentoCodigo: string;
  dataOrcamento: string;
  validadeOrcamento: string;
  valorTotal: string;
  condicoesPagamento: string;
  clausulasAdicionais: string;
  dataGeracao: string;
  itens: { descricao: string; dente: string | null; face: string | null; qtde: number; valor: number; total: number }[];
  corpoHtml: string;
  contratoTitulo: string;
}

function ContractDocument({ data }: { data: ContractData }) {
  const hoje = new Date().toLocaleDateString('pt-BR');

  return React.createElement(Document, null,
    React.createElement(Page, { size: 'A4', style: styles.page },
      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.clinicName }, data.clinicaNome),
        React.createElement(Text, { style: styles.clinicSub }, `CNPJ: ${data.clinicaCnpj} · ${data.clinicaEndereco}`),
      ),

      // Title
      React.createElement(Text, { style: styles.title }, data.contratoTitulo),

      // Parties
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Partes'),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Contratante:'),
          React.createElement(Text, { style: styles.value }, `${data.pacienteNome} · CPF ${data.pacienteCpf}`),
        ),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'E-mail:'),
          React.createElement(Text, { style: styles.value }, data.pacienteEmail),
        ),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Contratada:'),
          React.createElement(Text, { style: styles.value }, data.clinicaNome),
        ),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Responsável:'),
          React.createElement(Text, { style: styles.value }, `${data.dentistaNome} · CRO ${data.dentistaCro}`),
        ),
      ),

      // Items table
      data.itens.length > 0 && React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Procedimentos'),
        React.createElement(View, { style: styles.tableHeader },
          React.createElement(Text, { style: { ...styles.tableCell, flex: 3 } }, 'Procedimento'),
          React.createElement(Text, { style: styles.tableCellNarrow }, 'Dente'),
          React.createElement(Text, { style: styles.tableCellNarrow }, 'Qtde'),
          React.createElement(Text, { style: styles.tableCellNarrow }, 'Total'),
        ),
        ...data.itens.map((item, i) =>
          React.createElement(View, { key: i, style: styles.tableRow },
            React.createElement(Text, { style: { ...styles.tableCell, flex: 3 } }, item.descricao),
            React.createElement(Text, { style: styles.tableCellNarrow }, item.dente ?? '—'),
            React.createElement(Text, { style: styles.tableCellNarrow }, String(item.qtde)),
            React.createElement(Text, { style: styles.tableCellNarrow }, item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })),
          )
        ),
      ),

      // Total
      React.createElement(View, { style: styles.total },
        React.createElement(Text, { style: styles.totalLabel }, 'VALOR TOTAL:'),
        React.createElement(Text, { style: styles.totalValue }, data.valorTotal),
      ),

      // Payment conditions
      data.condicoesPagamento && React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Condições de Pagamento'),
        React.createElement(Text, { style: styles.body }, data.condicoesPagamento),
      ),

      // Contract body (stripped HTML)
      data.corpoHtml && React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Termos e Condições'),
        React.createElement(Text, { style: styles.body }, stripHtml(data.corpoHtml)),
      ),

      // Additional clauses
      data.clausulasAdicionais && React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Cláusulas Adicionais'),
        React.createElement(Text, { style: styles.clausulas }, data.clausulasAdicionais),
      ),

      // Validity
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.body },
          `Orçamento ${data.orcamentoCodigo} · Válido até ${data.validadeOrcamento} · Gerado em ${data.dataGeracao}`
        ),
      ),

      // Signature area
      React.createElement(View, { style: styles.signature },
        React.createElement(View, { style: styles.sigBlock },
          React.createElement(View, { style: styles.sigLine }),
          React.createElement(Text, { style: styles.sigLabel }, data.pacienteNome),
          React.createElement(Text, { style: styles.sigLabel }, 'CPF: ' + data.pacienteCpf),
          React.createElement(Text, { style: styles.sigLabel }, 'Contratante'),
        ),
        React.createElement(View, { style: styles.sigBlock },
          React.createElement(View, { style: styles.sigLine }),
          React.createElement(Text, { style: styles.sigLabel }, data.dentistaNome),
          React.createElement(Text, { style: styles.sigLabel }, 'CRO: ' + data.dentistaCro),
          React.createElement(Text, { style: styles.sigLabel }, 'Clínica Contratada'),
        ),
      ),

      // Footer
      React.createElement(View, { style: styles.footer, fixed: true },
        React.createElement(Text, { style: styles.footerText },
          `Documento gerado em ${hoje} — válido mediante assinatura digital`
        ),
        React.createElement(Text, { style: styles.footerText }, 'Verificável em assinafy.com.br/verificador'),
        React.createElement(Text,
          { style: styles.footerText, render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `${pageNumber}/${totalPages}` }
        ),
      ),
    )
  );
}

export async function generateContractPdf(contratoId: string): Promise<Buffer> {
  const supabase = await createClient();

  // Load contract + related data
  const { data: c, error } = await supabase
    .from('contratos')
    .select(`
      *,
      pacientes(nome, cpf, email, telefone, endereco),
      orcamentos(
        codigo, valor_total, validade, clausulas_adicionais, condicoes_pagamento,
        orcamento_itens(descricao, dente, face, qtde, valor_unitario, total, selecionado)
      ),
      contratos_templates(nome, corpo_html)
    `)
    .eq('id', contratoId)
    .single();

  if (error || !c) throw new Error(`Contrato ${contratoId} não encontrado`);

  type Pac = { nome: string; cpf: string | null; email: string | null; telefone: string | null; endereco: string | null };
  type Orc = { codigo: string; valor_total: number; validade: string | null; clausulas_adicionais: string | null; condicoes_pagamento: Record<string, unknown> | null; orcamento_itens: { descricao: string; dente: string | null; face: string | null; qtde: number; valor_unitario: number; total: number; selecionado: boolean }[] };
  type Tmpl = { nome: string; corpo_html: string };

  const paciente = (c as unknown as { pacientes: Pac }).pacientes;
  const orc = (c as unknown as { orcamentos: Orc | null }).orcamentos;
  const template = (c as unknown as { contratos_templates: Tmpl | null }).contratos_templates;

  // Load clinic config
  const { data: cfgData } = await supabase.from('configuracoes').select('valor').eq('chave', 'clinica').single();
  const clinica = (cfgData?.valor as { nome?: string; cnpj?: string; endereco?: string; cidade?: string; dentista?: { nome?: string; cro?: string } } | null) ?? {};

  const hoje = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  const itens = (orc?.orcamento_itens ?? []).filter(i => i.selecionado);

  const data: ContractData = {
    clinicaNome: clinica.nome ?? 'Clínica Odontológica',
    clinicaCnpj: clinica.cnpj ?? '',
    clinicaEndereco: clinica.endereco ?? '',
    clinicaCidade: clinica.cidade ?? 'Balneário Camboriú/SC',
    dentistaNome: clinica.dentista?.nome ?? '',
    dentistaCro: clinica.dentista?.cro ?? '',
    pacienteNome: paciente?.nome ?? '',
    pacienteCpf: paciente?.cpf ?? '',
    pacienteEmail: paciente?.email ?? '',
    pacienteTelefone: paciente?.telefone ?? '',
    pacienteEndereco: paciente?.endereco ?? '',
    orcamentoCodigo: orc?.codigo ?? '',
    dataOrcamento: hoje,
    validadeOrcamento: orc?.validade ? new Date(orc.validade).toLocaleDateString('pt-BR') : '',
    valorTotal: Number(orc?.valor_total ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    condicoesPagamento: JSON.stringify(orc?.condicoes_pagamento ?? ''),
    clausulasAdicionais: orc?.clausulas_adicionais ?? '',
    dataGeracao: hoje,
    itens: itens.map(i => ({
      descricao: i.descricao,
      dente: i.dente,
      face: i.face,
      qtde: i.qtde,
      valor: i.valor_unitario,
      total: i.total,
    })),
    corpoHtml: template?.corpo_html ?? (c as { corpo_html_final?: string }).corpo_html_final ?? '',
    contratoTitulo: template?.nome ?? 'Contrato de Prestação de Serviços Odontológicos',
  };

  const readable = await pdf(React.createElement(ContractDocument, { data }) as React.ReactElement<DocumentProps>).toBuffer();
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as unknown as ArrayLike<number>));
  }
  return Buffer.concat(chunks);
}
