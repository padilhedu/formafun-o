import type { OrcamentoStatus } from '@/types/orcamentos';
import { STATUS_CONFIG } from '@/types/orcamentos';

export function StatusBadge({ status }: { status: OrcamentoStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="badge"
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        fontFamily: 'var(--font-montserrat)',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
      }}
    >
      {cfg.label.toUpperCase()}
    </span>
  );
}
