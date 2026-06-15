import Link from 'next/link';

interface Paciente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  status: string;
  created_at: string;
}

// Fallback mock para quando não há dados reais
const MOCK: Paciente[] = [
  { id: '1', nome: 'Ana Paula Ferreira', email: null, telefone: null, status: 'ativo', created_at: '2026-06-07T10:00:00Z' },
  { id: '2', nome: 'Marcos Silveira', email: null, telefone: null, status: 'ativo', created_at: '2026-06-06T10:00:00Z' },
  { id: '3', nome: 'Cláudia Mendes', email: null, telefone: null, status: 'ativo', created_at: '2026-06-05T10:00:00Z' },
  { id: '4', nome: 'Roberto Alves', email: null, telefone: null, status: 'ativo', created_at: '2026-06-04T10:00:00Z' },
  { id: '5', nome: 'Fernanda Costa', email: null, telefone: null, status: 'inativo', created_at: '2026-06-03T10:00:00Z' },
];

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-montserrat)',
      background: 'rgba(184,154,90,0.12)', border: '1px solid rgba(184,154,90,0.2)',
      color: '#B89A5A',
    }}>
      {initials}
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

interface Props {
  pacientes?: Paciente[];
}

export function RecentPatients({ pacientes }: Props) {
  const lista = pacientes && pacientes.length > 0 ? pacientes : MOCK;

  return (
    <div style={{
      borderRadius: 14,
      background: 'linear-gradient(145deg, #141416 0%, #111113 100%)',
      border: '1px solid rgba(255,255,255,0.07)',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 13, fontFamily: 'var(--font-montserrat)', fontWeight: 600, color: '#F5F2EA' }}>
            Pacientes Recentes
          </h2>
          <p style={{ fontSize: 11, color: '#8A8A93', fontFamily: 'var(--font-montserrat)', marginTop: 2 }}>
            {pacientes ? 'Cadastros mais recentes' : '5 mais recentes'}
          </p>
        </div>
        <Link href="/pacientes" style={{ fontSize: 12, fontWeight: 600, color: '#B89A5A', fontFamily: 'var(--font-montserrat)', textDecoration: 'none' }}>
          Ver todos →
        </Link>
      </div>

      {/* Tabela limpa — sem bordas entre colunas */}
      <div>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, padding: '0 4px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['Paciente', 'Cadastro', 'Status'].map(h => (
            <div key={h} style={{ fontSize: 9, fontFamily: 'var(--font-montserrat)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A8A93' }}>
              {h}
            </div>
          ))}
        </div>

        {lista.map((p, i) => (
          <Link
            key={p.id}
            href={`/pacientes/${p.id}`}
            style={{ textDecoration: 'none', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center', padding: '10px 4px', borderBottom: i < lista.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', borderRadius: 6, transition: 'background 0.12s', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {/* Nome + avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <Avatar name={p.nome} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-montserrat)', fontWeight: 600, color: '#F5F2EA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.nome}
                </div>
                {p.telefone && (
                  <div style={{ fontSize: 10, color: '#8A8A93', marginTop: 1 }}>{p.telefone}</div>
                )}
              </div>
            </div>

            {/* Data */}
            <div style={{ fontSize: 11, color: '#8A8A93', fontFamily: 'var(--font-montserrat)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
              {fmtDate(p.created_at)}
            </div>

            {/* Status */}
            <div style={{
              fontSize: 10, fontFamily: 'var(--font-montserrat)', fontWeight: 700,
              padding: '2px 7px', borderRadius: 20,
              background: p.status === 'ativo' ? 'rgba(74,222,128,0.1)' : 'rgba(138,138,147,0.1)',
              color: p.status === 'ativo' ? '#4ADE80' : '#8A8A93',
              border: `1px solid ${p.status === 'ativo' ? 'rgba(74,222,128,0.25)' : 'rgba(138,138,147,0.15)'}`,
              whiteSpace: 'nowrap',
            }}>
              {p.status}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
