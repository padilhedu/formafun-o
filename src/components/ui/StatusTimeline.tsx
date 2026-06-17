interface TimelineStep {
  label: string;
  timestamp?: string | null;
  done: boolean;
}

interface StatusTimelineProps {
  steps: TimelineStep[];
}

function fmtDate(ts: string) {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StatusTimeline({ steps }: StatusTimelineProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div key={i} style={{ display: "flex", gap: 12, position: "relative" }}>
            {/* Coluna do ícone */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: step.done ? "none" : "1.5px solid rgba(0,0,0,0.2)",
                  background: step.done ? "#1F7A4D" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {step.done && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              {!isLast && (
                <div style={{ width: 1, flex: 1, background: "rgba(0,0,0,0.1)", marginTop: 4, marginBottom: 4 }} />
              )}
            </div>

            {/* Conteúdo */}
            <div style={{ paddingBottom: isLast ? 0 : 16, flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12,
                fontFamily: "var(--font-montserrat)",
                fontWeight: 600,
                color: step.done ? "#1C1C1C" : "#9B9BA0",
                lineHeight: 1.3,
              }}>
                {step.label}
              </div>
              {step.timestamp && (
                <div style={{ fontSize: 10, color: "#9B9BA0", fontFamily: "var(--font-montserrat)", marginTop: 2 }}>
                  {fmtDate(step.timestamp)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
