'use client';

interface Props {
  nome: string;
  especialidade?: string;
  cro?: string;
  cidade?: string;
  pacientesAtivos?: number;
  profissionais?: number;
  cadeiras?: number;
}

export function CardClinica({ nome, especialidade, cro, cidade, pacientesAtivos, profissionais, cadeiras }: Props) {
  const initials = nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();

  return (
    <div className="card-sand" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
      {/* Label CLÍNICA */}
      <div style={{
        fontSize: 9, fontFamily: 'var(--font-montserrat)', fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A7A5A', marginBottom: 14,
      }}>
        CLÍNICA
      </div>

      {/* Badge CRO */}
      {cro && (
        <div style={{
          display: 'inline-block', fontSize: 9, fontFamily: 'var(--font-montserrat)', fontWeight: 700,
          letterSpacing: '0.07em', textTransform: 'uppercase',
          background: 'rgba(58,53,43,0.10)', color: '#3A352B',
          border: '1px solid rgba(58,53,43,0.2)', borderRadius: 6,
          padding: '2px 7px', marginBottom: 14,
        }}>
          {cro}
        </div>
      )}

      {/* Avatar + nome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(31,122,77,0.15)',
          border: '2px solid rgba(31,122,77,0.25)',
          fontSize: 17, fontWeight: 700, color: '#1F7A4D',
          fontFamily: 'var(--font-cormorant)',
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: 18, fontWeight: 600, color: '#3A352B', lineHeight: 1.2 }}>
            {nome}
          </div>
          {especialidade && (
            <div style={{ fontSize: 11, color: '#8A7A5A', fontFamily: 'var(--font-montserrat)', marginTop: 2 }}>
              {especialidade}
            </div>
          )}
        </div>
      </div>

      {/* Cidade */}
      {cidade && (
        <div style={{ fontSize: 11, color: '#8A7A5A', fontFamily: 'var(--font-montserrat)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1a3.5 3.5 0 0 1 3.5 3.5C9.5 7.5 6 11 6 11S2.5 7.5 2.5 4.5A3.5 3.5 0 0 1 6 1z" stroke="#8A7A5A" strokeWidth="1.2" /><circle cx="6" cy="4.5" r="1.2" fill="#8A7A5A" /></svg>
          {cidade}
        </div>
      )}

      {/* Contadores */}
      {(pacientesAtivos !== undefined || profissionais !== undefined || cadeiras !== undefined) && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {pacientesAtivos !== undefined && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: 20, fontWeight: 600, color: '#3A352B', lineHeight: 1 }}>{pacientesAtivos}</div>
              <div style={{ fontSize: 9, color: '#8A7A5A', fontFamily: 'var(--font-montserrat)', marginTop: 2 }}>Pacientes</div>
            </div>
          )}
          {profissionais !== undefined && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: 20, fontWeight: 600, color: '#3A352B', lineHeight: 1 }}>{profissionais}</div>
              <div style={{ fontSize: 9, color: '#8A7A5A', fontFamily: 'var(--font-montserrat)', marginTop: 2 }}>Profissionais</div>
            </div>
          )}
          {cadeiras !== undefined && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: 20, fontWeight: 600, color: '#3A352B', lineHeight: 1 }}>{cadeiras}</div>
              <div style={{ fontSize: 9, color: '#8A7A5A', fontFamily: 'var(--font-montserrat)', marginTop: 2 }}>Cadeiras</div>
            </div>
          )}
        </div>
      )}

      {/* Badge FF */}
      <div style={{
        position: 'absolute', top: 16, right: 16,
        width: 28, height: 28, borderRadius: 7,
        background: '#1F7A4D', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-cormorant)', fontWeight: 700, fontSize: 14, color: '#FFFFFF',
      }}>
        FF
      </div>

      <a href="/configuracoes" style={{
        display: 'block', width: '100%', padding: '7px',
        borderRadius: 8, textAlign: 'center',
        background: 'rgba(58,53,43,0.08)', border: '1px solid rgba(58,53,43,0.15)',
        color: '#3A352B', fontSize: 11, fontFamily: 'var(--font-montserrat)', fontWeight: 600,
        textDecoration: 'none', transition: 'background 0.15s',
      }}>
        Ver configurações →
      </a>
    </div>
  );
}
