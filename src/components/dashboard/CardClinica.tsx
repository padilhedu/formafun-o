'use client';

interface Props {
  nome: string;
  especialidade?: string;
  cro?: string;
  cidade?: string;
}

export function CardClinica({ nome, especialidade, cro, cidade }: Props) {
  const initials = nome
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className="card p-6 rounded-lg overflow-hidden"
      style={{
        background: 'var(--color-card-hero-bg)',
        border: 'none',
      }}
    >
      {/* Subtle top line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: 'rgba(255,255,255,0.1)',
        }}
      />

      {/* Badge CRO */}
      {cro && (
        <div
          style={{
            display: 'inline-block',
            fontSize: 9,
            fontFamily: 'var(--font-montserrat)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            background: 'rgba(255,255,255,0.15)',
            color: 'var(--color-card-hero-text)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 4,
            padding: '2px 7px',
            marginBottom: 16,
          }}
        >
          {cro}
        </div>
      )}

      {/* Avatar + nome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.25)',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--color-card-hero-bg)',
            fontFamily: 'var(--font-cormorant)',
            border: '2px solid rgba(255,255,255,0.3)',
          }}
        >
          {initials}
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--color-card-hero-text)',
              lineHeight: 1.2,
            }}
          >
            {nome}
          </div>
          {especialidade && (
            <div
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.7)',
                fontFamily: 'var(--font-montserrat)',
                marginTop: 2,
              }}
            >
              {especialidade}
            </div>
          )}
        </div>
      </div>

      {/* Info linha */}
      {cidade && (
        <div
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.6)',
            fontFamily: 'var(--font-montserrat)',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>📍</span> {cidade}
        </div>
      )}

      {/* Botão perfil */}
      <a
        href="/configuracoes"
        style={{
          display: 'block',
          width: '100%',
          padding: '8px',
          borderRadius: 'var(--radius-sm)',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: 'var(--color-card-hero-text)',
          fontSize: 12,
          fontFamily: 'var(--font-montserrat)',
          fontWeight: 600,
          textDecoration: 'none',
          transition: 'background 0.15s',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
        }}
      >
        Ver configurações →
      </a>
    </div>
  );
}
