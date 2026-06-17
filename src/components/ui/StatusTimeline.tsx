interface TimelineStep {
  label: string;
  done: boolean;
  timestamp?: string | null; // ISO ou 'YYYY-MM-DD'
  extra?: string;
}

interface StatusTimelineProps {
  steps: TimelineStep[];
}

function formatDate(ts: string) {
  try {
    return new Date(ts).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    });
  } catch { return ts; }
}

export function StatusTimeline({ steps }: StatusTimelineProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 16, position: 'relative' }}>
            {/* Linha vertical (exceto último) */}
            {!isLast && (
              <div style={{
                position: 'absolute',
                left: 9, top: 20,
                width: 1.5,
                height: 'calc(100% - 8px)',
                background: step.done ? 'rgba(31,122,77,0.30)' : 'rgba(0,0,0,0.08)',
              }} />
            )}

            {/* Círculo indicador */}
            <div style={{ flexShrink: 0, zIndex: 1 }}>
              {step.done ? (
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#1F7A4D',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ) : (
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: '1.5px solid rgba(0,0,0,0.15)',
                  background: '#FFFFFF',
                }} />
              )}
            </div>

            {/* Conteúdo */}
            <div style={{ flex: 1, paddingTop: 1 }}>
              <div style={{
                fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 600,
                color: step.done ? '#1C1C1C' : '#6B6B66',
              }}>
                {step.label}
              </div>
              {step.timestamp && (
                <div style={{ fontSize: 11, color: '#6B6B66', marginTop: 1 }}>
                  {formatDate(step.timestamp)}
                </div>
              )}
              {step.extra && (
                <div style={{ fontSize: 11, color: '#6B6B66', marginTop: 1 }}>{step.extra}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
