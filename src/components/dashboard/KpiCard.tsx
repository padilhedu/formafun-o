"use client";

import { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  color: "gold" | "success" | "warning" | "info" | "error";
  icon?: ReactNode;
  progress?: number; // 0-100
  progressLabel?: string;
}

const COLOR_MAP = {
  gold:    { accent: "#B89A5A", bg: "rgba(184,154,90,0.06)",  border: "rgba(184,154,90,0.18)",  glow: "rgba(184,154,90,0.12)" },
  success: { accent: "#4ADE80", bg: "rgba(74,222,128,0.06)",  border: "rgba(74,222,128,0.18)",  glow: "rgba(74,222,128,0.10)" },
  warning: { accent: "#FBBF24", bg: "rgba(251,191,36,0.06)",  border: "rgba(251,191,36,0.18)",  glow: "rgba(251,191,36,0.10)" },
  info:    { accent: "#60A5FA", bg: "rgba(96,165,250,0.06)",  border: "rgba(96,165,250,0.18)",  glow: "rgba(96,165,250,0.10)" },
  error:   { accent: "#F87171", bg: "rgba(248,113,113,0.06)", border: "rgba(248,113,113,0.18)", glow: "rgba(248,113,113,0.10)" },
};

export function KpiCard({ title, value, sub, trend, trendUp, color, icon, progress, progressLabel }: KpiCardProps) {
  const c = COLOR_MAP[color];

  return (
    <div
      className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-200"
      style={{
        background: "linear-gradient(145deg, #141416 0%, #111113 100%)",
        border: `1px solid ${c.border}`,
        boxShadow: `0 1px 3px rgba(0,0,0,0.4), 0 0 0 0 ${c.glow}`,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 20px rgba(0,0,0,0.5), 0 0 20px ${c.glow}`;
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 1px 3px rgba(0,0,0,0.4), 0 0 0 0 ${c.glow}`;
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      {/* Accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${c.accent}60, transparent)` }}
      />

      {/* Icon + label */}
      <div className="flex items-start justify-between mb-4">
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "#8A8A93", fontFamily: "var(--font-montserrat)" }}
        >
          {title}
        </span>
        {icon && (
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: c.bg, color: c.accent }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div
        className="text-4xl font-semibold leading-none mb-2 tabular-nums"
        style={{ color: "#F5F2EA", fontFamily: "var(--font-cormorant)", letterSpacing: "-0.02em" }}
      >
        {value}
      </div>

      {/* Sub */}
      {sub && (
        <div className="text-xs mb-3" style={{ color: "#8A8A93", fontFamily: "var(--font-montserrat)" }}>
          {sub}
        </div>
      )}

      {/* Progress bar */}
      {typeof progress === "number" && (
        <div className="mb-3">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, progress)}%`, background: `linear-gradient(90deg, ${c.accent}88, ${c.accent})` }}
            />
          </div>
          {progressLabel && (
            <div className="text-xs mt-1" style={{ color: "#8A8A93" }}>{progressLabel}</div>
          )}
        </div>
      )}

      {/* Trend badge */}
      {trend && (
        <div
          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: trendUp ? "rgba(74,222,128,0.1)" : "rgba(251,191,36,0.1)",
            color: trendUp ? "#4ADE80" : "#FBBF24",
            border: `1px solid ${trendUp ? "rgba(74,222,128,0.2)" : "rgba(251,191,36,0.2)"}`,
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
            {trendUp
              ? <path d="M4 1L7 6H1L4 1Z" />
              : <path d="M4 7L1 2H7L4 7Z" />}
          </svg>
          {trend}
        </div>
      )}
    </div>
  );
}
