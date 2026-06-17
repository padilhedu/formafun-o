'use client';

import type { OrcamentoHistorico } from '@/types/orcamentos';

interface Props {
  historico: OrcamentoHistorico[];
  onClose: () => void;
}

const EVENTO_LABELS: Record<string, string> = {
  criado: 'Orçamento criado',
  atualizado: 'Valores atualizados',
  enviado: 'Enviado ao paciente',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  contrato_assinado: 'Contrato assinado',
  desconto_aplicado: 'Desconto aplicado',
};

export function HistoricoModal({ historico, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, width: 480, maxWidth: '95vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 22, color: '#1C1C1C', fontWeight: 500, margin: 0 }}>Histórico de alterações</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6B6B66', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
          {historico.length === 0 && (
            <p style={{ padding: 24, color: '#6B6B66', fontSize: 13, textAlign: 'center' }}>Sem registros de alteração.</p>
          )}
          {historico.map((h, i) => (
            <div key={h.id} style={{
              padding: '12px 20px',
              borderBottom: i < historico.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined,
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1F7A4D', marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#1C1C1C', fontFamily: 'var(--font-montserrat)', fontWeight: 500 }}>
                  {EVENTO_LABELS[h.evento] ?? h.evento}
                </div>
                {h.detalhes && Object.keys(h.detalhes).length > 0 && (
                  <div style={{ fontSize: 11, color: '#6B6B66', fontFamily: 'var(--font-montserrat)', marginTop: 2 }}>
                    {Object.entries(h.detalhes).map(([k, v]) => `${k}: ${String(v)}`).join(' · ')}
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#6B6B66', marginTop: 3 }}>
                  {new Date(h.criado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
