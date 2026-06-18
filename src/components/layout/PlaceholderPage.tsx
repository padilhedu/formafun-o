interface PlaceholderPageProps {
  title: string;
  description: string;
  phase?: string;
  section?: string;
}

export function PlaceholderPage({ title, description, phase, section = 'OPERACIONAL' }: PlaceholderPageProps) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontFamily: 'var(--font-montserrat)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1F7A4D', marginBottom: 4 }}>
          {section}
        </p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 32, fontWeight: 600, color: '#1C1C1C', lineHeight: 1.1, marginBottom: 4 }}>
          {title}
        </h1>
        <p style={{ fontSize: 13, color: '#6B6B66', fontFamily: 'var(--font-montserrat)' }}>{description}</p>
      </div>

      <div style={{
        borderRadius: 14,
        background: 'linear-gradient(145deg, #141416 0%, #111113 100%)',
        border: '1px dashed rgba(31,122,77,0.2)',
        padding: '64px 24px',
        textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(31,122,77,0.08)', border: '1px solid rgba(31,122,77,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#1F7A4D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: 22, fontWeight: 600, color: '#1C1C1C', marginBottom: 8 }}>
          {title}
        </div>
        <p style={{ fontSize: 13, color: '#6B6B66', fontFamily: 'var(--font-montserrat)', maxWidth: 400, margin: '0 auto' }}>{description}</p>
        {phase && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16,
            padding: '6px 16px', borderRadius: 20,
            background: 'rgba(31,122,77,0.08)', border: '1px solid rgba(31,122,77,0.2)',
          }}>
            <span style={{ color: '#1F7A4D', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{phase}</span>
          </div>
        )}
      </div>
    </div>
  );
}
