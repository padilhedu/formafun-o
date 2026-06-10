interface KpiCardProps {
  title: string;
  value: string;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  color: "gold" | "success" | "warning" | "info" | "error";
}

const COLOR_MAP = {
  gold: { accent: "#B89A5A", bg: "rgba(184,154,90,0.08)", border: "rgba(184,154,90,0.2)" },
  success: { accent: "#4ADE80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)" },
  warning: { accent: "#FBBF24", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.2)" },
  info: { accent: "#60A5FA", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)" },
  error: { accent: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" },
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
        style={{ color: "#F5F2EA", fontFamily: "var(--font-cormorant)" }}
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
