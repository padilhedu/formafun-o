'use client';

import Link from 'next/link';

interface Evento {
  id: string;
  titulo: string;
  inicio: string;
  fim: string;
  status: string;
  pacientes?: { nome: string } | null;
}

interface Props {
  eventos: Evento[];
  dataHoje: string; // "Segunda, 9 de junho"
}

const STATUS_COR: Record<string, string> = {
  agendado: 'var(--color-warning)',
  confirmado: 'var(--color-success)',
  realizado: 'var(--color-text-muted)',
  cancelado: 'var(--color-error)',
  faltou: 'var(--color-error)',
};

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function AgendaHoje({ eventos, dataHoje }: Props) {
  return (
    <div
      className="card p-5 flex flex-col"
      style={{
        background: 'var(--color-bg-surface)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Agenda do Dia
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-muted)', marginTop: 2 }}>
            {dataHoje}
          </div>
        </div>
        <Link
          href="/agenda"
          className="text-xs font-semibold px-2 py-1 rounded"
          style={{
            background: 'var(--color-accent-soft)',
            color: 'var(--color-accent)',
            textDecoration: 'none',
            border: '1px solid var(--color-border)',
          }}
        >
          +
        </Link>
      </div>

      {eventos.length === 0 ? (
        <p className="text-xs text-center py-5" style={{ color: 'var(--color-text-muted)' }}>
          Nenhuma consulta hoje.
        </p>
      ) : (
        <div className="flex flex-col flex-1 gap-0">
          {eventos.map((ev, i) => {
            const cor = STATUS_COR[ev.status] ?? 'var(--color-text-muted)';
            return (
              <div
                key={ev.id}
                className="flex items-start gap-3 px-2 py-2 rounded transition-colors duration-150 hover:bg-bg-muted"
                style={{
                  borderBottomWidth: i < eventos.length - 1 ? '1px' : '0',
                  borderBottomColor: 'var(--color-divider)',
                }}
              >
                {/* Hora */}
                <div
                  className="text-xs flex-shrink-0 pt-0.5 w-12"
                  style={{
                    color: 'var(--color-text-muted)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {fmtHora(ev.inicio)}
                </div>

                {/* Status dot */}
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
                  style={{
                    background: cor,
                    boxShadow: `0 0 4px ${cor}40`,
                  }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs font-medium line-clamp-1"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {ev.titulo}
                  </div>
                  {ev.pacientes && (
                    <div
                      className="text-xs mt-0.5 line-clamp-1"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {ev.pacientes.nome}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
