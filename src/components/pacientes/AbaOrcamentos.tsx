import Link from 'next/link';
import type { Orcamento } from '@/types/orcamentos';
import { STATUS_CONFIG } from '@/types/orcamentos';

interface Props {
  pacienteId: string;
  orcamentos: Orcamento[];
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function AbaOrcamentos({ pacienteId, orcamentos }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-offwhite font-medium" style={{ fontFamily: 'var(--font-montserrat)', fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B6B66' }}>
          Orçamentos
        </h2>
        <Link
          href={`/orcamentos/novo?paciente_id=${pacienteId}`}
          className="btn-primary text-xs"
          style={{ padding: '6px 14px' }}
        >
          + Novo Orçamento
        </Link>
      </div>

      {orcamentos.length === 0 ? (
        <div className="card text-center py-12" style={{ borderStyle: 'dashed', borderColor: 'rgba(31,122,77,0.15)' }}>
          <p className="text-muted text-sm">Nenhum orçamento para este paciente.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Código', 'Status', 'Data', 'Validade', 'Total', ''].map(h => (
                  <th key={h} className="table-header" style={{ padding: '10px 16px', textAlign: h === 'Total' ? 'right' : 'left', fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orcamentos.map(orc => {
                const cfg = STATUS_CONFIG[orc.status];
                return (
                  <tr key={orc.id} className="table-row-hover" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="text-gold font-medium" style={{ fontSize: 12, fontFamily: 'var(--font-montserrat)' }}>{orc.codigo}</span>
                      {orc.travado && (
                        <span className="ml-2" style={{ fontSize: 9, background: 'rgba(74,222,128,0.1)', color: '#1F7A4D', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 3, padding: '1px 5px', fontFamily: 'var(--font-montserrat)' }}>TRAVADO</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 10 }}>
                        {cfg.label.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="text-muted text-sm">{new Date(orc.criado_em).toLocaleDateString('pt-BR')}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="text-muted text-sm">{orc.validade ? new Date(orc.validade).toLocaleDateString('pt-BR') : '—'}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span className="text-offwhite font-medium" style={{ fontFamily: 'var(--font-montserrat)', fontSize: 13 }}>
                        {formatBRL(orc.valor_total)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <Link href={`/orcamentos/${orc.id}`} className="text-gold" style={{ fontSize: 12, fontFamily: 'var(--font-montserrat)' }}>
                        Ver →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
