import { Sparkline } from "@/components/ui/Sparkline";

interface KpiCardProps {
  title: string;
  value: string;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  color?: "green" | "amber" | "red" | "blue" | "gray";
  sparkline?: number[];
}

const COLOR_MAP = {
  green: { accent: "#1F7A4D", trendBg: "rgba(31,122,77,0.10)", trendColor: "#1F7A4D" },
  amber: { accent: "#C98A1E", trendBg: "rgba(201,138,30,0.10)", trendColor: "#C98A1E" },
  red:   { accent: "#C0392B", trendBg: "rgba(192,57,43,0.10)",  trendColor: "#C0392B" },
  blue:  { accent: "#2D6AA3", trendBg: "rgba(45,106,163,0.10)", trendColor: "#2D6AA3" },
  gray:  { accent: "#6B6B66", trendBg: "rgba(107,107,102,0.10)",trendColor: "#6B6B66" },
};

export function KpiCard({ title, value, sub, trend, trendUp, color = "green", sparkline }: KpiCardProps) {
  const c = COLOR_MAP[color];
  const isDown = trendUp === false;

  return (
    <div className="card p-5" style={{ position: "relative", overflow: "hidden" }}>
      {/* Label */}
      <div style={{
        fontSize: "0.62rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#9B9BA0",
        marginBottom: 10,
        fontFamily: "var(--font-montserrat)",
      }}>
        {title}
      </div>

      {/* Valor + sparkline */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
        <div
          className="heading"
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "2rem",
            fontWeight: 600,
            color: "#1C1C1C",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </div>
        {sparkline && sparkline.length > 1 && (
          <div style={{ marginBottom: 2, flexShrink: 0 }}>
            <Sparkline data={sparkline} color={c.accent} width={80} height={28} />
          </div>
        )}
      </div>

      {/* Sub */}
      {sub && (
        <div style={{ fontSize: "0.7rem", color: "#9B9BA0", fontFamily: "var(--font-montserrat)", marginTop: 6 }}>
          {sub}
        </div>
      )}

      {/* Trend */}
      {trend && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginTop: 10,
            padding: "0.15rem 0.5rem",
            borderRadius: 9999,
            fontSize: "0.68rem",
            fontWeight: 600,
            fontFamily: "var(--font-montserrat)",
            background: isDown ? "rgba(192,57,43,0.10)" : c.trendBg,
            color: isDown ? "#C0392B" : c.trendColor,
          }}
        >
          <span>{isDown ? "↘" : "↗"}</span>
          {trend}
        </div>
      )}
    </div>
  );
}
