interface Counter {
  label: string;
  value: number | string;
  accent?: boolean;
}

interface ClinicaCardProps {
  nome?: string;
  subtitulo?: string;
  contadores?: Counter[];
  style?: React.CSSProperties;
}

export function ClinicaCard({
  nome = 'Forma & Função',
  subtitulo = 'Balneário Camboriú · SC',
  contadores = [],
  style,
}: ClinicaCardProps) {
  return (
    <div
      style={{
        background: '#E8E0D0',
        borderRadius: 14,
        padding: '1.25rem',
        border: '1px solid rgba(0,0,0,0.06)',
        ...style,
      }}
    >
      {/* Nome */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 18, fontWeight: 600,
        color: '#1C1C1C', letterSpacing: '-0.01em',
        marginBottom: 2,
      }}>
        {nome}
      </div>
      <div style={{ fontSize: 11, color: '#6B6B66', fontFamily: 'var(--font-body)', marginBottom: contadores.length ? 16 : 0 }}>
        {subtitulo}
      </div>

      {/* Contadores */}
      {contadores.length > 0 && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {contadores.map((c, i) => (
            <div key={i}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22, fontWeight: 600,
                color: c.accent ? '#1F7A4D' : '#1C1C1C',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {c.value}
              </div>
              <div style={{ fontSize: 10, color: '#6B6B66', fontFamily: 'var(--font-body)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 3 }}>
                {c.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
