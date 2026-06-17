'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { OrcamentoStatus } from '@/types/orcamentos';
import type { ContratoStatus } from '@/types/contratos';
import { CONTRATO_STATUS_CONFIG } from '@/types/contratos';
import { GerarContratoModal } from '@/components/contratos/GerarContratoModal';

interface ContratoResumo {
  id: string;
  codigo: string;
  status: ContratoStatus;
}

interface Props {
  orcamentoId: string;
  pacienteId: string;
  status: OrcamentoStatus;
  contratos: ContratoResumo[];
}

export function OrcamentoContratoArea({ orcamentoId, pacienteId, status, contratos: contratosIniciais }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [contratos, setContratos] = useState<ContratoResumo[]>(contratosIniciais);

  const assinados = contratos.filter(c => c.status === 'assinado').length;
  const total = contratos.length;
  const podeGerar = status === 'aprovado';

  function onContratoGerado() {
    // Refresh via router ou reload da lista
    setShowModal(false);
    window.location.reload();
  }

  return (
    <div>
      {/* Cabeçalho da seção */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="table-header mb-0.5">Documentos para assinatura</div>
          {total > 0 && (
            <div style={{ fontSize: 11, color: assinados === total ? '#4ADE80' : '#8A8A93', fontFamily: 'var(--font-montserrat)' }}>
              {assinados} de {total} documento{total !== 1 ? 's' : ''} assinado{assinados !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        {podeGerar && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-ghost text-xs"
            style={{ padding: '6px 14px', fontSize: 11 }}
          >
            + Novo documento
          </button>
        )}
      </div>

      {/* Lista de contratos */}
      {contratos.length === 0 ? (
        <div className="card" style={{ padding: '16px', borderStyle: 'dashed', borderColor: 'rgba(184,154,90,0.15)' }}>
          {podeGerar ? (
            <>
              <p className="text-muted text-xs mb-3">
                Orçamento aprovado — gere os contratos e TCLEs para envio ao paciente.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary text-xs w-full"
                style={{ padding: '8px 0' }}
              >
                Gerar Primeiro Documento
              </button>
            </>
          ) : (
            <p className="text-muted text-xs">Documentos disponíveis após aprovação do orçamento.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {contratos.map(c => {
            const cfg = CONTRATO_STATUS_CONFIG[c.status];
            return (
              <div key={c.id} className="card" style={{ padding: '12px 14px' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Indicador de status */}
                    <div style={{ width: 3, height: 36, borderRadius: 2, background: cfg.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontFamily: 'var(--font-montserrat)', fontWeight: 600, color: '#F5F2EA' }}>
                        {c.codigo}
                      </div>
                      <div style={{ marginTop: 3 }}>
                        <span className="badge" style={{
                          background: cfg.bg,
                          color: cfg.color,
                          border: `1px solid ${cfg.border}`,
                          fontSize: 9,
                        }}>
                          {cfg.label.toUpperCase()}
                        </span>
                        {c.status === 'assinado' && (
                          <span style={{ marginLeft: 6, fontSize: 9, color: '#4ADE80', fontFamily: 'var(--font-montserrat)', fontWeight: 700 }}>
                            ✓ Travado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/contratos/${c.id}`}
                    className="text-gold text-xs"
                    style={{ fontFamily: 'var(--font-montserrat)', flexShrink: 0 }}
                  >
                    Ver →
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Barra de progresso quando há múltiplos documentos */}
          {total > 1 && (
            <div style={{ marginTop: 4 }}>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(assinados / total) * 100}%`,
                  background: assinados === total ? '#4ADE80' : '#B89A5A',
                  borderRadius: 2,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <GerarContratoModal
          orcamentoId={orcamentoId}
          pacienteId={pacienteId}
          onClose={onContratoGerado}
        />
      )}
    </div>
  );
}
