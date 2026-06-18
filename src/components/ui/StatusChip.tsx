import { ORCAMENTO_STATUS, AGENDA_STATUS, CONTRATO_STATUS } from "@/lib/status";

type ChipType = "orcamento" | "agenda" | "contrato";

interface StatusChipProps {
  status: string;
  type?: ChipType;
}

const STATUS_MAPS = {
  orcamento: ORCAMENTO_STATUS,
  agenda:    AGENDA_STATUS,
  contrato:  CONTRATO_STATUS,
};

export function StatusChip({ status, type = "orcamento" }: StatusChipProps) {
  const map = STATUS_MAPS[type] as Record<string, { label: string; color: string; bg: string; border: string }>;
  const cfg = map[status] ?? { label: status, color: "#6B6B66", bg: "rgba(107,107,102,0.1)", border: "rgba(107,107,102,0.2)" };
  const expired = status === "expirado";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        padding: "0.2rem 0.6rem",
        borderRadius: "9999px",
        fontSize: "0.68rem",
        fontWeight: 600,
        fontFamily: "var(--font-montserrat)",
        letterSpacing: "0.03em",
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        textDecoration: expired ? "line-through" : "none",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: cfg.color,
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      {cfg.label}
    </span>
  );
}
