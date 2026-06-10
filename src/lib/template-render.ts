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
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

export function renderTemplate(html: string, data: TemplateData): string {
  const { paciente, orcamento, itens = [] } = data;

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
    '{{paciente_nome}}':       paciente.nome,
    '{{paciente_cpf}}':        paciente.cpf ?? '—',
    '{{paciente_email}}':      paciente.email ?? '—',
    '{{paciente_telefone}}':   paciente.telefone ?? '—',
    '{{paciente_endereco}}':   endereco,
    '{{orcamento_codigo}}':    orcamento?.codigo ?? '—',
    '{{orcamento_total}}':     orcamento ? formatBRL(orcamento.valor_total) : '—',
    '{{orcamento_validade}}':  formatDate(orcamento?.validade),
    '{{itens_tabela}}':        buildItensTabela(itens),
    '{{condicoes_pagamento}}': orcamento?.observacoes ?? '—',
    '{{data_atual}}':          new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
  };

  let result = html;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replaceAll(key, value);
  }
  return result;
}
