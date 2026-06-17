'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { OrcamentoStatus } from '@/types/orcamentos';
import type { ContratoStatus } from '@/types/contratos';
import { CONTRATO_STATUS_CONFIG } from '@/types/contratos';
import { GerarContratoModal } from '@/components/contratos/GerarContratoModal';

interface Props {
  orcamentoId: string;
  pacienteId: string;
  status: OrcamentoStatus;
  contratoExistente: { id: string; codigo: string; status: ContratoStatus } | null;
}

export function OrcamentoContratoArea({ orcamentoId, pacienteId, status, contratoExistente }: Props) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div className="mb-2" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: '#6B6B66', fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase' }}>
        Contrato
      </div>

      {contratoExistente ? (
        <div className="card" style={{ padding: '14px 16px' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-offwhite text-sm font-medium" style={{ fontFamily: 'var(--font-montserrat)' }}>
                {contratoExistente.codigo}
              </div>
              <div style={{ marginTop: 3 }}>
                <span className="badge" style={{
                  background: CONTRATO_STATUS_CONFIG[contratoExistente.status].bg,
                  color: CONTRATO_STATUS_CONFIG[contratoExistente.status].color,
                  border: `1px solid ${CONTRATO_STATUS_CONFIG[contratoExistente.status].border}`,
                  fontSize: 9,
                }}>
                  {CONTRATO_STATUS_CONFIG[contratoExistente.status].label.toUpperCase()}
                </span>
              </div>
            </div>
            <Link href={`/contratos/${contratoExistente.id}`} className="text-gold text-xs" style={{ fontFamily: 'var(--font-montserrat)' }}>
              Ver →
            </Link>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '14px 16px', borderStyle: 'dashed', borderColor: 'rgba(31,122,77,0.15)' }}>
          {status === 'aprovado' ? (
            <>
              <p className="text-muted text-xs mb-3">Orçamento aprovado — gere o contrato para envio ao paciente.</p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary text-xs w-full"
                style={{ padding: '8px 0' }}
              >
                Gerar Contrato
              </button>
            </>
          ) : (
            <p className="text-muted text-xs">Contrato disponível após aprovação do orçamento.</p>
          )}
        </div>
      )}

      {showModal && (
        <GerarContratoModal
          orcamentoId={orcamentoId}
          pacienteId={pacienteId}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
