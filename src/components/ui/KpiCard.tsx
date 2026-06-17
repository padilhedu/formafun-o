import { Sparkline } from './Sparkline';

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral';
  sub?: string;
  sparkline?: number[];
  className?: string;
  style?: React.CSSProperties;
}

export function KpiCard({ label, value, delta, trend = 'neutral', sub, sparkline, style }: KpiCardProps) {
  const deltaColor = trend === 'down' ? '#C0392B' : trend === 'up' ? '#1F7A4D' : '#6B6B66';
  const deltaBg    = trend === 'down' ? 'rgba(192,57,43,0.10)' : trend === 'up' ? 'rgba(31,122,77,0.10)' : 'rgba(107,107,102,0.10)';
  const arrow      = trend === 'down' ? '↘' : trend === 'up' ? '↗' : '→';

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 14,
        padding: '1.25rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        ...style,
      }}
    >
      {/* Label + delta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B66' }}>
          {label}
        </span>
        {delta && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 2,
            fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-body)',
            padding: '2px 8px', borderRadius: 9999,
            background: deltaBg, color: deltaColor,
          }}>
            {arrow} {delta}
          </span>
        )}
      </div>

      {/* Value + sparkline */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 34, fontWeight: 600,
            lineHeight: 1, color: '#1C1C1C',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.01em',
          }}>
            {value}
          </div>
          {sub && (
            <div style={{ fontSize: 11, color: '#6B6B66', marginTop: 4, fontFamily: 'var(--font-body)' }}>
              {sub}
            </div>
          )}
        </div>
        {sparkline && sparkline.length > 1 && (
          <Sparkline data={sparkline} color={trend === 'down' ? '#C0392B' : '#1F7A4D'} />
        )}
      </div>
    </div>
  );
}
