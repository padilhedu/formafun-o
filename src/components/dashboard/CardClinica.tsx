'use client';

interface Props {
  nome: string;
  especialidade?: string;
  cro?: string;
  cidade?: string;
}

export function CardClinica({ nome, especialidade, cro, cidade }: Props) {
  const initials = nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();

  return (
    <div style={{
      borderRadius: 16,
      background: 'linear-gradient(145deg, #1C1208 0%, #0F0A04 100%)',
      border: '1px solid rgba(31,122,77,0.25)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle gold glow top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(31,122,77,0.6), transparent)' }} />

      {/* Badge CRO */}
      {cro && (
        <div style={{
          display: 'inline-block', fontSize: 9, fontFamily: 'var(--font-montserrat)', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          background: 'rgba(31,122,77,0.12)', color: '#1F7A4D',
          border: '1px solid rgba(31,122,77,0.25)', borderRadius: 4,
          padding: '2px 7px', marginBottom: 16,
        }}>
          {cro}
        </div>
      )}

      {/* Avatar + nome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #1F7A4D 0%, #6B6B66 100%)',
          fontSize: 18, fontWeight: 700, color: '#F5F3EF',
          fontFamily: 'var(--font-cormorant)',
          border: '2px solid rgba(31,122,77,0.4)',
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: 20, fontWeight: 600, color: '#1C1C1C', lineHeight: 1.2 }}>
            {nome}
          </div>
          {especialidade && (
            <div style={{ fontSize: 11, color: '#6B6B66', fontFamily: 'var(--font-montserrat)', marginTop: 2 }}>
              {especialidade}
            </div>
          )}
        </div>
      </div>

      {/* Info linha */}
      {cidade && (
        <div style={{ fontSize: 11, color: '#6B6B66', fontFamily: 'var(--font-montserrat)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#1F7A4D' }}>📍</span> {cidade}
        </div>
      )}

      {/* Botão perfil */}
      <a href="/configuracoes" style={{
        display: 'block', width: '100%', padding: '8px',
        borderRadius: 8, textAlign: 'center',
        background: 'rgba(31,122,77,0.12)', border: '1px solid rgba(31,122,77,0.3)',
        color: '#6B6B66', fontSize: 12, fontFamily: 'var(--font-montserrat)', fontWeight: 600,
        textDecoration: 'none', transition: 'background 0.15s',
      }}>
        Ver configurações →
      </a>
    </div>
  );
}
