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
  dataHoje: string;
}

const STATUS_COR: Record<string, string> = {
  agendado: '#C98A1E',
  confirmado: '#1F7A4D',
  realizado: '#6B6B66',
  cancelado: '#C0392B',
  faltou: '#C0392B',
};

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
}

export function AgendaHoje({ eventos, dataHoje }: Props) {
  return (
    <div style={{
      borderRadius: 14,
      background: '#FFFFFF',
      border: '1px solid rgba(0,0,0,0.08)',
      padding: 16,
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600, color: '#1C1C1C' }}>
            Agenda do Dia
          </div>
          <div style={{ fontSize: 10, color: '#6B6B66', fontFamily: 'var(--font-body)', marginTop: 1, textTransform: 'capitalize' }}>
            {dataHoje}
          </div>
        </div>
        <Link href="/agenda" style={{
          fontSize: 11, fontFamily: 'var(--font-body)', fontWeight: 600,
          background: 'rgba(31,122,77,0.08)', border: '1px solid rgba(31,122,77,0.20)',
          color: '#1F7A4D', borderRadius: 6, padding: '3px 8px', textDecoration: 'none',
        }}>
          Ver agenda
        </Link>
      </div>

      {eventos.length === 0 ? (
        <p style={{ fontSize: 12, color: '#6B6B66', textAlign: 'center', padding: '20px 0', fontFamily: 'var(--font-body)' }}>
          Nenhuma consulta hoje.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {eventos.map((ev, i) => {
            const cor = STATUS_COR[ev.status] ?? '#6B6B66';
            return (
              <div
                key={ev.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 6px',
                  borderBottom: i < eventos.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  borderRadius: 6, cursor: 'pointer', transition: 'background 0.12s',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(31,122,77,0.04)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                <div style={{
                  fontSize: 10, color: '#6B6B66', fontFamily: 'var(--font-body)',
                  fontVariantNumeric: 'tabular-nums', width: 36, flexShrink: 0, paddingTop: 2,
                }}>
                  {fmtHora(ev.inicio)}
                </div>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: cor, flexShrink: 0, marginTop: 4 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 600, color: '#1C1C1C', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.titulo}
                  </div>
                  {ev.pacientes && (
                    <div style={{ fontSize: 10, color: '#6B6B66', fontFamily: 'var(--font-body)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
