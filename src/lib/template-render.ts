import { formatBRL } from '@/lib/fmt';
import type { Orcamento, OrcamentoItem } from '@/types/orcamentos';
import { CATEGORIA_LABELS } from '@/types/orcamentos';

interface TemplateData {
  paciente: {
    nome: string;
    cpf: string | null;
    email: string | null;
    telefone: string | null;
    endereco?: Record<string, string> | null;
  };
  orcamento?: Orcamento | null;
  itens?: OrcamentoItem[];
  /** Dados extras: campos preenchidos pela recepção (dados_recepcao) + pelo paciente (dados_paciente_extras) */
  extras?: Record<string, unknown>;
  /** Nome da clínica para templates que não têm orçamento */
  clinica_nome?: string;
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

function buildItensTabela(itens: OrcamentoItem[]): string {
  if (!itens || itens.length === 0) return '<p><em>Nenhum item no orçamento.</em></p>';

  const grouped = itens.reduce<Record<string, OrcamentoItem[]>>((acc, item) => {
    const cat = item.categoria ?? 'outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  let html = '<table style="width:100%;border-collapse:collapse;margin:12px 0"><thead><tr>';
  html += '<th style="border:1px solid #999;padding:6px 10px;background:#f5f5f5;text-align:left">Procedimento</th>';
  html += '<th style="border:1px solid #999;padding:6px 10px;background:#f5f5f5;text-align:center">Dente</th>';
  html += '<th style="border:1px solid #999;padding:6px 10px;background:#f5f5f5;text-align:right">Qtde</th>';
  html += '<th style="border:1px solid #999;padding:6px 10px;background:#f5f5f5;text-align:right">Total</th>';
  html += '</tr></thead><tbody>';

  for (const [cat, catItens] of Object.entries(grouped)) {
    const catLabel = CATEGORIA_LABELS[cat as keyof typeof CATEGORIA_LABELS] ?? cat;
    html += `<tr><td colspan="4" style="border:1px solid #999;padding:5px 10px;background:#fdf9f3;font-weight:bold;font-size:10pt">${catLabel}</td></tr>`;
    for (const item of catItens) {
      html += `<tr>
        <td style="border:1px solid #999;padding:6px 10px">${item.descricao}</td>
        <td style="border:1px solid #999;padding:6px 10px;text-align:center">${item.dente ?? '—'}</td>
        <td style="border:1px solid #999;padding:6px 10px;text-align:right">${item.qtde}</td>
        <td style="border:1px solid #999;padding:6px 10px;text-align:right">${formatBRL(item.total)}</td>
      </tr>`;
    }
  }

  html += '</tbody></table>';
  return html;
}

function formatCheckboxList(values: unknown): string {
  if (!Array.isArray(values) || values.length === 0) return '—';
  if (values.length === 1) return String(values[0]);
  if (values.length === 2) return `${values[0]} e ${values[1]}`;
  return values.slice(0, -1).join(', ') + ' e ' + values[values.length - 1];
}

export function renderTemplate(html: string, data: TemplateData): string {
  const { paciente, orcamento, itens = [], extras = {}, clinica_nome } = data;

  const endereco = paciente.endereco
    ? [
        paciente.endereco.logradouro,
        paciente.endereco.numero,
        paciente.endereco.bairro,
        paciente.endereco.cidade,
        paciente.endereco.estado,
      ].filter(Boolean).join(', ')
    : '—';

  const replacements: Record<string, string> = {
    // Paciente (registro)
    '{{paciente_nome}}':       paciente.nome,
    '{{paciente_cpf}}':        paciente.cpf ?? '—',
    '{{paciente_email}}':      paciente.email ?? '—',
    '{{paciente_telefone}}':   paciente.telefone ?? '—',
    '{{paciente_endereco}}':   endereco,
    // Orçamento
    '{{orcamento_codigo}}':    orcamento?.codigo ?? '—',
    '{{orcamento_total}}':     orcamento ? formatBRL(orcamento.valor_total) : '—',
    '{{orcamento_validade}}':  formatDate(orcamento?.validade),
    '{{itens_tabela}}':        buildItensTabela(itens),
    '{{condicoes_pagamento}}': orcamento?.observacoes ?? '—',
    // Clínica
    '{{clinica_nome}}':        clinica_nome ?? '—',
    // Data
    '{{data_atual}}':          new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
    // Campos extras — recepção + paciente
    '{{paciente_estado_civil}}':    String(extras.estado_civil ?? '—'),
    '{{paciente_rg}}':              String(extras.rg ?? '—'),
    '{{paciente_orgao_expedidor}}': String(extras.orgao_expedidor ?? '—'),
    // Campos do responsável legal (template menor)
    '{{responsavel_nome}}':         String(extras.responsavel_nome ?? '—'),
    '{{responsavel_estado_civil}}': String(extras.responsavel_estado_civil ?? '—'),
    '{{responsavel_rg}}':           String(extras.responsavel_rg ?? '—'),
    '{{responsavel_orgao_expedidor}}': String(extras.responsavel_orgao_expedidor ?? '—'),
    '{{responsavel_cpf}}':          String(extras.responsavel_cpf ?? '—'),
    '{{responsavel_endereco}}':     String(extras.responsavel_endereco ?? '—'),
    // Campos recepcao — LGPD
    '{{meios_divulgacao}}': formatCheckboxList(extras.meios_divulgacao),
    // Campos recepcao — Recibo documentos
    '{{itens_entregues}}':  formatCheckboxList(extras.itens_entregues),
    '{{forma_entrega}}':    String(extras.forma_entrega ?? '—'),
    // Campos recepcao — Recibo prontuário
    '{{num_folhas}}':  String(extras.num_folhas ?? '—'),
    '{{tipo_copia}}':  String(extras.tipo_copia ?? '—'),
  };

  let result = html;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replaceAll(key, value);
  }
  return result;
}

/**
 * Renderiza o template substituindo campos do paciente por espaços em branco visíveis.
 * Usado para prévia do documento antes do paciente completar os dados.
 */
export function renderTemplateParcial(html: string, data: Omit<TemplateData, 'extras'>): string {
  const blank = '<span style="border-bottom:1px solid #999;display:inline-block;min-width:120px;color:#999;font-style:italic;font-size:9pt;">a preencher</span>';
  const camposPaciente: Record<string, string> = {
    '{{paciente_estado_civil}}':       blank,
    '{{paciente_rg}}':                 blank,
    '{{paciente_orgao_expedidor}}':    blank,
    '{{responsavel_nome}}':            blank,
    '{{responsavel_estado_civil}}':    blank,
    '{{responsavel_rg}}':              blank,
    '{{responsavel_orgao_expedidor}}': blank,
    '{{responsavel_cpf}}':             blank,
    '{{responsavel_endereco}}':        blank,
  };
  // Substitui campos do paciente por "a preencher" antes de chamar renderTemplate
  let result = html;
  for (const [key, value] of Object.entries(camposPaciente)) {
    result = result.replaceAll(key, value);
  }
  // Renderiza campos de sistema/recepção (extras vazio — campos paciente já foram substituídos)
  return renderTemplate(result, { ...data, extras: {} });
}
