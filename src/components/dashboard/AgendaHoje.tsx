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
  agendado: '#FBBF24',
  confirmado: '#4ADE80',
  realizado: '#8A8A93',
  cancelado: '#F87171',
  faltou: '#F87171',
};

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function AgendaHoje({ eventos, dataHoje }: Props) {
  return (
    <div style={{
      borderRadius: 14,
      background: 'linear-gradient(145deg, #141416 0%, #111113 100%)',
      border: '1px solid rgba(255,255,255,0.07)',
      padding: '16px',
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontFamily: 'var(--font-montserrat)', fontWeight: 600, color: '#F5F2EA' }}>
            Agenda do Dia
          </div>
          <div style={{ fontSize: 10, color: '#8A8A93', fontFamily: 'var(--font-montserrat)', marginTop: 1 }}>
            {dataHoje}
          </div>
        </div>
        <Link href="/agenda" style={{
          fontSize: 11, fontFamily: 'var(--font-montserrat)', fontWeight: 600,
          background: 'rgba(184,154,90,0.08)', border: '1px solid rgba(184,154,90,0.2)',
          color: '#B89A5A', borderRadius: 6, padding: '3px 8px', textDecoration: 'none',
        }}>
          +
        </Link>
      </div>

      {eventos.length === 0 ? (
        <p style={{ fontSize: 12, color: '#8A8A93', textAlign: 'center', padding: '20px 0' }}>
          Nenhuma consulta hoje.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {eventos.map((ev, i) => {
            const cor = STATUS_COR[ev.status] ?? '#8A8A93';
            return (
              <div
                key={ev.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 6px',
                  borderBottom: i < eventos.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  borderRadius: 6, cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Hora */}
                <div style={{
                  fontSize: 10, color: '#8A8A93', fontFamily: 'var(--font-montserrat)',
                  fontVariantNumeric: 'tabular-nums', width: 36, flexShrink: 0, paddingTop: 2,
                }}>
                  {fmtHora(ev.inicio)}
                </div>

                {/* Status dot */}
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: cor, flexShrink: 0, marginTop: 4, boxShadow: `0 0 4px ${cor}80` }} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontFamily: 'var(--font-montserrat)', fontWeight: 600, color: '#F5F2EA', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.titulo}
                  </div>
                  {ev.pacientes && (
                    <div style={{ fontSize: 10, color: '#8A8A93', fontFamily: 'var(--font-montserrat)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
