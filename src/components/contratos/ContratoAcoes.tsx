'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ContratoStatus } from '@/types/contratos';

interface Props {
  contratoId: string;
  status: ContratoStatus;
  pdfToken: string;
}

export function ContratoAcoes({ contratoId, status, pdfToken }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState('');
  const [msg, setMsg] = useState('');

  const enviar = async () => {
    setLoading('enviar');
    setMsg('');
    try {
      const res = await fetch(`/api/contratos/${contratoId}/enviar`, { method: 'POST' });
      const data = await res.json() as { _dev_mode?: boolean; message?: string; error?: string };
      if (!res.ok) {
        setMsg(data.error ?? 'Erro ao enviar');
      } else if (data._dev_mode) {
        setMsg('Dev: ZAPSIGN_API_TOKEN ausente — marcado como enviado');
        router.refresh();
      } else {
        router.refresh();
      }
    } finally {
      setLoading('');
    }
  };

  const cancelar = async () => {
    setLoading('cancelar');
    try {
      await fetch(`/api/contratos/${contratoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelado' }),
      });
      router.refresh();
    } finally {
      setLoading('');
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2 flex-wrap justify-end">
        {/* Print */}
        <a
          href={`/api/contratos/${contratoId}/pdf?print=1`}
          target="_blank"
          className="btn-ghost text-xs"
          style={{ padding: '7px 14px' }}
        >
          Imprimir / PDF
        </a>

        {/* Public link */}
        <a
          href={`/api/contratos/${contratoId}/pdf?token=${pdfToken}`}
          target="_blank"
          className="btn-ghost text-xs"
          style={{ padding: '7px 14px' }}
        >
          Link Público
        </a>

        {/* Send to ZapSign */}
        {(status === 'rascunho' || status === 'enviado') && (
          <button
            onClick={enviar}
            disabled={!!loading}
            className="btn-primary text-xs"
            style={{ padding: '7px 16px' }}
          >
            {loading === 'enviar' ? '...' : status === 'enviado' ? 'Reenviar ZapSign' : '✉ Enviar para Assinatura'}
          </button>
        )}

        {/* Cancel */}
        {status !== 'assinado' && status !== 'cancelado' && (
          <button
            onClick={cancelar}
            disabled={!!loading}
            className="btn-ghost text-xs"
            style={{ padding: '7px 14px', color: '#C0392B' }}
          >
            Cancelar
          </button>
        )}
      </div>

      {msg && (
        <p style={{ fontSize: 11, color: '#C98A1E', fontFamily: 'var(--font-montserrat)', maxWidth: 320, textAlign: 'right' }}>
          {msg}
        </p>
      )}
    </div>
  );
}
