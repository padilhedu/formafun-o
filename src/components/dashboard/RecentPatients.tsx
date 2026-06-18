'use client';

import Link from 'next/link';

interface Paciente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  status: string;
  created_at: string;
}

const MOCK: Paciente[] = [
  { id: '1', nome: 'Ana Paula Ferreira', email: null, telefone: null, status: 'ativo', created_at: '2026-06-07T10:00:00Z' },
  { id: '2', nome: 'Marcos Silveira', email: null, telefone: null, status: 'ativo', created_at: '2026-06-06T10:00:00Z' },
  { id: '3', nome: 'Cláudia Mendes', email: null, telefone: null, status: 'ativo', created_at: '2026-06-05T10:00:00Z' },
  { id: '4', nome: 'Roberto Alves', email: null, telefone: null, status: 'ativo', created_at: '2026-06-04T10:00:00Z' },
  { id: '5', nome: 'Fernanda Costa', email: null, telefone: null, status: 'inativo', created_at: '2026-06-03T10:00:00Z' },
];

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)',
      background: 'rgba(31,122,77,0.10)', color: '#1F7A4D',
    }}>
      {initials}
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function RecentPatients({ pacientes }: { pacientes?: Paciente[] }) {
  const lista = pacientes && pacientes.length > 0 ? pacientes : MOCK;

  return (
    <div style={{
      borderRadius: 14,
      background: '#FFFFFF',
      border: '1px solid rgba(0,0,0,0.08)',
      padding: 20,
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600, color: '#1C1C1C' }}>
            Pacientes Recentes
          </h2>
          <p style={{ fontSize: 11, color: '#6B6B66', fontFamily: 'var(--font-body)', marginTop: 2 }}>
            Cadastros mais recentes
          </p>
        </div>
        <Link href="/pacientes" style={{ fontSize: 12, fontWeight: 600, color: '#1F7A4D', fontFamily: 'var(--font-body)', textDecoration: 'none' }}>
          Ver todos →
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, padding: '0 4px 8px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        {['Paciente', 'Cadastro', 'Status'].map(h => (
          <div key={h} style={{ fontSize: 9, fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B66' }}>
            {h}
          </div>
        ))}
      </div>

      {lista.map((p, i) => (
        <Link
          key={p.id}
          href={`/pacientes/${p.id}`}
          style={{
            textDecoration: 'none',
            display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12,
            alignItems: 'center', padding: '10px 4px',
            borderBottom: i < lista.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
            borderRadius: 6, transition: 'background 0.12s', cursor: 'pointer',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(31,122,77,0.04)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Avatar name={p.nome} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 600, color: '#1C1C1C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.nome}
              </div>
              {p.telefone && (
                <div style={{ fontSize: 10, color: '#6B6B66', marginTop: 1 }}>{p.telefone}</div>
              )}
            </div>
          </div>

          <div style={{ fontSize: 11, color: '#6B6B66', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
            {fmtDate(p.created_at)}
          </div>

          <div style={{
            fontSize: 10, fontFamily: 'var(--font-body)', fontWeight: 700,
            padding: '2px 7px', borderRadius: 20,
            background: p.status === 'ativo' ? 'rgba(31,122,77,0.10)' : 'rgba(107,107,102,0.10)',
            color: p.status === 'ativo' ? '#1F7A4D' : '#6B6B66',
            border: `1px solid ${p.status === 'ativo' ? 'rgba(31,122,77,0.25)' : 'rgba(107,107,102,0.15)'}`,
            whiteSpace: 'nowrap',
          }}>
            {p.status}
          </div>
        </Link>
      ))}
    </div>
  );
}
