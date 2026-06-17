'use client';

import { ReactNode, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  width?: string | number;
}

interface DataTableProps<T extends { id?: string | number }> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export function AvatarInitials({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'rgba(31,122,77,0.10)',
        color: '#1F7A4D',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 700, fontFamily: 'var(--font-body)',
        flexShrink: 0, userSelect: 'none',
      }}
    >
      {initials(name)}
    </div>
  );
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  pageSize = 10,
  emptyMessage = 'Nenhum registro encontrado.',
  onRowClick,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(data.length / pageSize);
  const slice = data.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FAF8F4', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: '9px 14px',
                    textAlign: 'left',
                    fontSize: 10,
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#6B6B66',
                    whiteSpace: 'nowrap',
                    width: col.width,
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ padding: '32px 14px', textAlign: 'center', color: '#6B6B66', fontSize: 13, fontFamily: 'var(--font-body)' }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              slice.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  onClick={() => onRowClick?.(row)}
                  style={{
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(31,122,77,0.04)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{ padding: '10px 14px', fontSize: 13, fontFamily: 'var(--font-body)', color: '#1C1C1C', verticalAlign: 'middle' }}
                    >
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: 11, color: '#6B6B66', fontFamily: 'var(--font-body)' }}>
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, data.length)} de {data.length}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)',
                background: 'transparent', cursor: page === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: page === 0 ? '#C5C5C0' : '#1C1C1C',
              }}
              aria-label="Página anterior"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              style={{
                width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)',
                background: 'transparent', cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: page === totalPages - 1 ? '#C5C5C0' : '#1C1C1C',
              }}
              aria-label="Próxima página"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
