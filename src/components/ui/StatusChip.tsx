import { getStatusConfig } from '@/lib/status';

interface StatusChipProps {
  status: string;
  type?: 'orcamento' | 'agenda' | 'contrato';
  size?: 'sm' | 'md';
}

export function StatusChip({ status, type = 'orcamento', size = 'sm' }: StatusChipProps) {
  const cfg = getStatusConfig(status, type);
  const fs  = size === 'sm' ? 10 : 12;
  const pad = size === 'sm' ? '3px 9px' : '4px 12px';
  const dot = size === 'sm' ? 5 : 7;

  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: pad, borderRadius: 9999,
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        flexShrink: 0, whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: dot, height: dot, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      <span style={{
        fontSize: fs,
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        color: cfg.color,
        textDecoration: cfg.lineThrough ? 'line-through' : 'none',
      }}>
        {cfg.label}
      </span>
    </span>
  );
}
