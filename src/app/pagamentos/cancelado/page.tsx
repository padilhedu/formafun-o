'use client';

export default function PagamentoCanceladoPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F3EF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'Montserrat, sans-serif',
    }}>
      <div style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: '3rem 2.5rem',
        maxWidth: 440,
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(248,113,113,0.1)',
          border: '2px solid rgba(248,113,113,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
          fontSize: 28,
          color: '#C0392B',
        }}>
          ✕
        </div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, color: '#1C1C1C', fontWeight: 500, marginBottom: '1rem' }}>
          Pagamento cancelado
        </h1>
        <p style={{ fontSize: 13, color: '#6B6B66', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          O pagamento não foi concluído. Nenhum valor foi cobrado.
          Você pode tentar novamente ou entrar em contato com a clínica.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            background: 'rgba(31,122,77,0.1)',
            border: '1px solid rgba(31,122,77,0.3)',
            borderRadius: 10,
            color: '#1F7A4D',
            padding: '10px 24px',
            fontSize: 13,
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Voltar e tentar novamente
        </button>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: 11, color: '#4A4A53' }}>Clínica Forma &amp; Função · Balneário Camboriú/SC</p>
        </div>
      </div>
    </div>
  );
}
