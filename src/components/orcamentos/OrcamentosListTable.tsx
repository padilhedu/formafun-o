'use client';

import Link from 'next/link';
import { DataTable } from '@/components/ui/DataTable';
import { StatusChip } from '@/components/ui/StatusChip';
import type { OrcamentoComPaciente } from '@/types/orcamentos';

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const COLUMNS = [
  {
    key: 'codigo',
    header: 'Código',
    render: (o: unknown) => (
      <span style={{ fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700, color: '#1F7A4D' }}>
        {(o as OrcamentoComPaciente).codigo}
      </span>
    ),
  },
  {
    key: 'paciente',
    header: 'Paciente',
    render: (o: unknown) => (
      <span style={{ fontSize: 13, color: '#1C1C1C', fontFamily: 'var(--font-body)' }}>
        {(o as OrcamentoComPaciente).pacientes?.nome ?? '—'}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (o: unknown) => (
      <StatusChip status={(o as OrcamentoComPaciente).status} type="orcamento" size="sm" />
    ),
  },
  {
    key: 'validade',
    header: 'Validade',
    render: (o: unknown) => {
      const orc = o as OrcamentoComPaciente;
      return (
        <span style={{ fontSize: 12, color: '#6B6B66', fontFamily: 'var(--font-body)', fontVariantNumeric: 'tabular-nums' }}>
          {orc.validade ? new Date(orc.validade).toLocaleDateString('pt-BR') : '—'}
        </span>
      );
    },
  },
  {
    key: 'valor_total',
    header: 'Total',
    render: (o: unknown) => (
      <span style={{ fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600, color: '#1C1C1C', fontVariantNumeric: 'tabular-nums' }}>
        {formatBRL((o as OrcamentoComPaciente).valor_total)}
      </span>
    ),
  },
  {
    key: 'acao',
    header: '',
    render: (o: unknown) => (
      <Link
        href={`/orcamentos/${(o as OrcamentoComPaciente).id}`}
        style={{ fontSize: 12, color: '#1F7A4D', fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'none' }}
      >
        Ver →
      </Link>
    ),
  },
];

export function OrcamentosListTable({ orcamentos }: { orcamentos: OrcamentoComPaciente[] }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <DataTable
        columns={COLUMNS}
        data={orcamentos}
        pageSize={15}
        emptyMessage="Nenhum orçamento encontrado."
      />
    </div>
  );
}
