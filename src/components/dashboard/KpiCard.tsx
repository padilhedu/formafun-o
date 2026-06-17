interface KpiCardProps {
  title: string;
  value: string;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  color: "accent" | "success" | "warning" | "info" | "error";
}

const COLOR_MAP = {
  accent: { accent: "var(--color-accent)", bg: "var(--color-accent-soft)", border: "var(--color-accent)" },
  success: { accent: "var(--color-success)", bg: "var(--color-success-soft)", border: "var(--color-success)" },
  warning: { accent: "var(--color-warning)", bg: "var(--color-warning-soft)", border: "var(--color-warning)" },
  info: { accent: "var(--color-info)", bg: "var(--color-info-soft)", border: "var(--color-info)" },
  error: { accent: "var(--color-error)", bg: "var(--color-error-soft)", border: "var(--color-error)" },
};

export function KpiCard({ title, value, sub, trend, trendUp, color }: KpiCardProps) {
  const c = COLOR_MAP[color];

  return (
    <div
      className="card p-5 flex flex-col justify-between h-full"
      style={{ borderLeftWidth: "3px", borderLeftColor: c.accent }}
    >
      <div>
        <div className="text-text-muted text-xs font-medium tracking-wide uppercase mb-3">
          {title}
        </div>
        <div
          className="heading text-3xl font-semibold mb-1"
          style={{
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-cormorant)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </div>
        {sub && (
          <div className="text-text-secondary text-xs mb-2">{sub}</div>
        )}
      </div>

      {trend && (
        <div
          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit"
          style={{
            background: trendUp ? "var(--color-success-soft)" : "var(--color-warning-soft)",
            color: trendUp ? "var(--color-success)" : "var(--color-warning)",
          }}
        >
          <span>{trendUp ? "↑" : "↓"}</span>
          {trend}
        </div>
      )}
    </div>
  );
}
