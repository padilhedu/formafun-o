import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Orcamento, OrcamentoItem } from '@/types/orcamentos';
import { CATEGORIA_LABELS } from '@/types/orcamentos';

export const dynamic = 'force-dynamic';

interface OrcamentoFull extends Orcamento {
  orcamento_itens: OrcamentoItem[];
  pacientes: { nome: string; cpf: string | null; telefone: string | null; email: string | null } | null;
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function ImprimirOrcamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } = await supabase
    .from('orcamentos')
    .select('*, pacientes(nome, cpf, telefone, email), orcamento_itens(*)')
    .eq('id', id)
    .single();

  if (error || !data) notFound();

  const orc = data as unknown as OrcamentoFull;
  const itens = [...(orc.orcamento_itens ?? [])].sort((a, b) =>
    (a.categoria ?? '').localeCompare(b.categoria ?? '')
  );

  const grouped = itens.reduce<Record<string, OrcamentoItem[]>>((acc, item) => {
    const cat = item.categoria ?? 'outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const desconto = orc.desconto_tipo === 'percentual'
    ? orc.valor_subtotal * (orc.desconto_valor / 100)
    : orc.desconto_valor;

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <title>{orc.codigo} — Forma & Função</title>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Montserrat:wght@400;500;600&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Montserrat', sans-serif; color: #1a1a1a; background: #fff; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #1F7A4D; margin-bottom: 28px; }
          .clinic-name { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 600; color: #1a1a1a; }
          .clinic-sub { font-size: 11px; color: #666; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 4px; }
          .orc-code { font-size: 18px; font-weight: 700; color: #1F7A4D; }
          .orc-status { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #4a4a4a; margin-top: 4px; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #1F7A4D; padding: 8px 0; border-bottom: 1px solid #e5e5e5; margin-bottom: 12px; }
          .patient-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
          .field label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; }
          .field p { font-size: 13px; color: #1a1a1a; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          thead th { padding: 8px 10px; text-align: left; font-size: 9px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #666; border-bottom: 1px solid #ddd; background: #fafafa; }
          thead th.right { text-align: right; }
          tbody td { padding: 9px 10px; font-size: 12px; border-bottom: 1px solid #f0f0f0; }
          tbody td.right { text-align: right; }
          tbody tr:last-child td { border-bottom: none; }
          .cat-header { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #1F7A4D; padding: 10px; background: #fdf9f3; border-bottom: 1px solid #e8d9bb; }
          .totals { display: flex; justify-content: flex-end; }
          .totals-box { width: 280px; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
          .totals-row.total { border-top: 2px solid #1F7A4D; margin-top: 6px; padding-top: 10px; font-weight: 700; font-size: 16px; color: #1F7A4D; }
          .discount { color: #2a9d2a; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; display: flex; justify-content: space-between; font-size: 10px; color: #aaa; }
          .obs { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px; padding: 14px; font-size: 12px; color: #444; white-space: pre-wrap; }
          @media print {
            body { padding: 20px; }
            @page { margin: 15mm; size: A4; }
          }
        `}</style>
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: 'window.onload = () => window.print();' }} />

        <div className="header">
          <div>
            <div className="clinic-name">Forma & Função</div>
            <div className="clinic-sub">Odontologia Premium · Balneário Camboriú/SC</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="orc-code">{orc.codigo}</div>
            <div className="orc-status">{orc.status.charAt(0).toUpperCase() + orc.status.slice(1)}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
              Emitido em {new Date(orc.criado_em).toLocaleDateString('pt-BR')}
            </div>
            {orc.validade && (
              <div style={{ fontSize: 11, color: '#888' }}>
                Válido até {new Date(orc.validade).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
        </div>

        {/* Patient */}
        <div className="section">
          <div className="section-title">Paciente</div>
          <div className="patient-grid">
            <div className="field"><label>Nome</label><p>{orc.pacientes?.nome ?? '—'}</p></div>
            <div className="field"><label>CPF</label><p>{orc.pacientes?.cpf ?? '—'}</p></div>
            <div className="field"><label>Telefone</label><p>{orc.pacientes?.telefone ?? '—'}</p></div>
          </div>
        </div>

        {/* Items */}
        <div className="section">
          <div className="section-title">Procedimentos</div>
          {Object.entries(grouped).map(([cat, catItens]) => (
            <div key={cat} style={{ marginBottom: 16, border: '1px solid #e5e5e5', borderRadius: 6, overflow: 'hidden' }}>
              <div className="cat-header">
                {CATEGORIA_LABELS[cat as keyof typeof CATEGORIA_LABELS] ?? cat}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Procedimento</th>
                    <th>Dente</th>
                    <th className="right">Valor Unit.</th>
                    <th className="right">Qtde</th>
                    <th className="right">Desconto</th>
                    <th className="right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {catItens.map(item => (
                    <tr key={item.id}>
                      <td>{item.descricao}</td>
                      <td>{item.dente ?? '—'}</td>
                      <td className="right">{formatBRL(item.valor_unitario)}</td>
                      <td className="right">{item.qtde}</td>
                      <td className="right" style={{ color: item.desconto_item > 0 ? '#2a9d2a' : undefined }}>
                        {item.desconto_item > 0 ? `- ${formatBRL(item.desconto_item)}` : '—'}
                      </td>
                      <td className="right" style={{ fontWeight: 600 }}>{formatBRL(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="totals section">
          <div className="totals-box">
            <div className="totals-row">
              <span>Subtotal</span>
              <span>{formatBRL(orc.valor_subtotal)}</span>
            </div>
            {desconto > 0 && (
              <div className="totals-row discount">
                <span>Desconto {orc.desconto_tipo === 'percentual' ? `(${orc.desconto_valor}%)` : ''}</span>
                <span>- {formatBRL(desconto)}</span>
              </div>
            )}
            <div className="totals-row total">
              <span>TOTAL</span>
              <span>{formatBRL(orc.valor_total)}</span>
            </div>
          </div>
        </div>

        {/* Observations */}
        {orc.observacoes && (
          <div className="section">
            <div className="section-title">Observações e Condições de Pagamento</div>
            <div className="obs">{orc.observacoes}</div>
          </div>
        )}

        {/* Signature */}
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          <div>
            <div style={{ borderTop: '1px solid #999', paddingTop: 8, fontSize: 11, color: '#666', textAlign: 'center' }}>Assinatura do Paciente</div>
          </div>
          <div>
            <div style={{ borderTop: '1px solid #999', paddingTop: 8, fontSize: 11, color: '#666', textAlign: 'center' }}>Responsável Técnico — Forma & Função</div>
          </div>
        </div>

        <div className="footer">
          <span>Forma & Função Odontologia — Balneário Camboriú/SC</span>
          <span>{orc.codigo} · {new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </body>
    </html>
  );
}
