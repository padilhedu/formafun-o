'use client';

import Link from 'next/link';

interface KanbanCardProps {
  id: string;
  codigo: string;
  pacienteNome: string | null;
  criadoEm: string;
  valorTotal: number;
  travado?: boolean;
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function KanbanCard({ id, codigo, pacienteNome, criadoEm, valorTotal, travado }: KanbanCardProps) {
  return (
    <Link
      href={`/orcamentos/${id}`}
      style={{
        display: 'block', padding: '12px 14px', borderRadius: 12,
        background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        textDecoration: 'none', transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(31,122,77,0.10)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(31,122,77,0.25)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.08)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-body)', fontWeight: 700, color: '#1F7A4D', letterSpacing: '0.04em' }}>
          {codigo}
        </span>
        {travado && (
          <span style={{ fontSize: 9, background: 'rgba(31,122,77,0.10)', color: '#1F7A4D', border: '1px solid rgba(31,122,77,0.25)', borderRadius: 4, padding: '1px 6px', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            TRAVADO
          </span>
        )}
      </div>
      <div style={{ fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 500, color: '#1C1C1C', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {pacienteNome ?? '—'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: '#6B6B66', fontFamily: 'var(--font-body)' }}>
          {new Date(criadoEm).toLocaleDateString('pt-BR')}
        </span>
        <span style={{ fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600, color: '#1C1C1C', fontVariantNumeric: 'tabular-nums' }}>
          {formatBRL(valorTotal)}
        </span>
      </div>
    </Link>
  );
}
