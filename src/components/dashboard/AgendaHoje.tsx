'use client';

import Link from 'next/link';
import { StatusChip } from '@/components/ui/StatusChip';

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

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
}

export function AgendaHoje({ eventos, dataHoje }: Props) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontFamily: 'var(--font-montserrat)', fontWeight: 600, color: '#1C1C1C' }}>
            Agenda de hoje
          </div>
          <div style={{ fontSize: 11, color: '#9B9BA0', fontFamily: 'var(--font-montserrat)', marginTop: 1 }}>
            {dataHoje}
          </div>
        </div>
        <Link href="/agenda" style={{
          fontSize: 11, fontFamily: 'var(--font-montserrat)', fontWeight: 600,
          color: '#1F7A4D', textDecoration: 'none',
        }}>
          Ver agenda completa →
        </Link>
      </div>

      {eventos.length === 0 ? (
        <p style={{ fontSize: 12, color: '#9B9BA0', textAlign: 'center', padding: '20px 0' }}>
          Nenhuma consulta hoje.
        </p>
      ) : (
        <div>
          {/* Header da tabela */}
          <div style={{
            display: 'grid', gridTemplateColumns: '52px 1fr auto',
            padding: '6px 8px', marginBottom: 4,
          }}>
            <div className="table-header" style={{ background: 'transparent' }}>Hora</div>
            <div className="table-header" style={{ background: 'transparent' }}>Paciente / Procedimento</div>
            <div className="table-header" style={{ background: 'transparent' }}>Status</div>
          </div>

          {eventos.map((ev, i) => (
            <div
              key={ev.id}
              className="table-row-hover"
              style={{
                display: 'grid', gridTemplateColumns: '52px 1fr auto',
                padding: '8px 8px', gap: 8,
                borderTop: i > 0 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <div style={{
                fontSize: 11, color: '#9B9BA0', fontFamily: 'var(--font-montserrat)',
                fontVariantNumeric: 'tabular-nums', fontWeight: 600,
              }}>
                {fmtHora(ev.inicio)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-montserrat)', fontWeight: 600, color: '#1C1C1C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ev.pacientes?.nome ?? ev.titulo}
                </div>
                <div style={{ fontSize: 10, color: '#9B9BA0', fontFamily: 'var(--font-montserrat)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ev.titulo}
                </div>
              </div>
              <StatusChip status={ev.status} type="agenda" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
