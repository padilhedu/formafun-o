'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OrcamentoStatus } from '@/types/orcamentos';

interface Props {
  orcamentoId: string;
  status: OrcamentoStatus;
  travado: boolean;
  codigo: string;
}

export function OrcamentoAcoes({ orcamentoId, status, travado, codigo }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState('');

  const mudarStatus = async (novoStatus: OrcamentoStatus) => {
    setLoading(novoStatus);
    try {
      await fetch(`/api/orcamentos/${orcamentoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });
      router.refresh();
    } finally {
      setLoading('');
    }
  };

  const aprovar = async () => {
    setLoading('aprovado');
    try {
      await fetch(`/api/orcamentos/${orcamentoId}/aprovar`, { method: 'POST' });
      router.refresh();
    } finally {
      setLoading('');
    }
  };

  const travar = async () => {
    setLoading('travar');
    try {
      await fetch(`/api/orcamentos/${orcamentoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ travado: true }),
      });
      router.refresh();
    } finally {
      setLoading('');
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Status transitions */}
      {!travado && status === 'rascunho' && (
        <button
          onClick={() => mudarStatus('enviado')}
          disabled={!!loading}
          className="btn-ghost text-xs"
          style={{ padding: '7px 14px' }}
        >
          {loading === 'enviado' ? '...' : 'Marcar Enviado'}
        </button>
      )}
      {!travado && status === 'enviado' && (
        <button
          onClick={() => mudarStatus('negociacao')}
          disabled={!!loading}
          className="btn-ghost text-xs"
          style={{ padding: '7px 14px' }}
        >
          Em Negociação
        </button>
      )}
      {!travado && (status === 'enviado' || status === 'negociacao') && (
        <button
          onClick={() => mudarStatus('recusado')}
          disabled={!!loading}
          className="btn-ghost text-xs"
          style={{ padding: '7px 14px', color: '#C0392B' }}
        >
          Recusado
        </button>
      )}
      {!travado && status !== 'aprovado' && status !== 'recusado' && (
        <button
          onClick={aprovar}
          disabled={!!loading}
          className="btn-primary text-xs"
          style={{ padding: '7px 16px' }}
        >
          {loading === 'aprovado' ? '...' : '✓ Aprovar'}
        </button>
      )}
      {status === 'aprovado' && !travado && (
        <button
          onClick={travar}
          disabled={!!loading}
          className="btn-primary text-xs"
          style={{ padding: '7px 16px', background: 'rgba(74,222,128,0.15)', color: '#1F7A4D', border: '1px solid rgba(74,222,128,0.3)' }}
        >
          {loading === 'travar' ? '...' : 'Travar Orçamento'}
        </button>
      )}
    </div>
  );
}
