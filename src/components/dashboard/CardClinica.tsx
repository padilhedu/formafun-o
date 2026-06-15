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
      border: '1px solid rgba(184,154,90,0.25)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle gold glow top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(184,154,90,0.6), transparent)' }} />

      {/* Badge CRO */}
      {cro && (
        <div style={{
          display: 'inline-block', fontSize: 9, fontFamily: 'var(--font-montserrat)', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          background: 'rgba(184,154,90,0.12)', color: '#B89A5A',
          border: '1px solid rgba(184,154,90,0.25)', borderRadius: 4,
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
          background: 'linear-gradient(135deg, #B89A5A 0%, #D9C9A3 100%)',
          fontSize: 18, fontWeight: 700, color: '#0A0A0B',
          fontFamily: 'var(--font-cormorant)',
          border: '2px solid rgba(184,154,90,0.4)',
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: 20, fontWeight: 600, color: '#F5F2EA', lineHeight: 1.2 }}>
            {nome}
          </div>
          {especialidade && (
            <div style={{ fontSize: 11, color: '#D9C9A3', fontFamily: 'var(--font-montserrat)', marginTop: 2 }}>
              {especialidade}
            </div>
          )}
        </div>
      </div>

      {/* Info linha */}
      {cidade && (
        <div style={{ fontSize: 11, color: '#8A8A93', fontFamily: 'var(--font-montserrat)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#B89A5A' }}>📍</span> {cidade}
        </div>
      )}

      {/* Botão perfil */}
      <a href="/configuracoes" style={{
        display: 'block', width: '100%', padding: '8px',
        borderRadius: 8, textAlign: 'center',
        background: 'rgba(184,154,90,0.12)', border: '1px solid rgba(184,154,90,0.3)',
        color: '#D9C9A3', fontSize: 12, fontFamily: 'var(--font-montserrat)', fontWeight: 600,
        textDecoration: 'none', transition: 'background 0.15s',
      }}>
        Ver configurações →
      </a>
    </div>
  );
}
