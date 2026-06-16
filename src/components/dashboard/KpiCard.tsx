interface KpiCardProps {
  title: string;
  value: string;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  color: "gold" | "success" | "warning" | "info" | "error";
}

const COLOR_MAP = {
  gold: { accent: "#59399E", bg: "rgba(89,57,158,0.06)", border: "rgba(89,57,158,0.25)" },
  success: { accent: "#16A34A", bg: "rgba(22,163,74,0.06)", border: "rgba(22,163,74,0.2)" },
  warning: { accent: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)" },
  info: { accent: "#2563EB", bg: "rgba(37,99,235,0.06)", border: "rgba(37,99,235,0.2)" },
  error: { accent: "#DC2626", bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.2)" },
};

export function KpiCard({ title, value, sub, trend, trendUp, color }: KpiCardProps) {
  const c = COLOR_MAP[color];

  return (
    <div
      className="card p-5"
      style={{ borderLeft: `3px solid ${c.accent}` }}
    >
      <div className="text-muted text-xs font-medium tracking-wide uppercase mb-3">
        {title}
      </div>
      <div
        className="heading text-3xl font-semibold mb-1"
        style={{ color: "#1A1A1A", fontFamily: "var(--font-cormorant)" }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-muted text-xs mb-2">{sub}</div>
      )}
      {trend && (
        <div
          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            background: trendUp ? "rgba(74,222,128,0.1)" : "rgba(251,191,36,0.1)",
            color: trendUp ? "#4ADE80" : "#FBBF24",
          }}
        >
          <span>{trendUp ? "↑" : "↓"}</span>
          {trend}
        </div>
      )}
    </div>
  );
}
