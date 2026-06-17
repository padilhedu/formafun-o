import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function PagamentoSucessoPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  let pago = false;
  let descricao = '';
  let valor = '';

  if (session_id) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id);
      pago = session.payment_status === 'paid';
      const item = session.metadata?.codigo ? `Ref: ${session.metadata.codigo}` : 'Serviço odontológico';
      descricao = item;
      if (session.amount_total) {
        valor = (session.amount_total / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      }
    } catch {
      // Sessão inválida ou expirada
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0B',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'Montserrat, sans-serif',
    }}>
      <div style={{
        background: '#121214',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: '3rem 2.5rem',
        maxWidth: 440,
        width: '100%',
        textAlign: 'center',
      }}>
        {pago ? (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(74,222,128,0.1)',
              border: '2px solid rgba(74,222,128,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: 28,
            }}>
              ✓
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, color: '#F5F2EA', fontWeight: 500, marginBottom: '0.5rem' }}>
              Pagamento confirmado
            </h1>
            {descricao && (
              <p style={{ fontSize: 13, color: '#8A8A93', marginBottom: '0.25rem' }}>{descricao}</p>
            )}
            {valor && (
              <p style={{ fontSize: 20, color: '#4ADE80', fontWeight: 700, marginBottom: '1.5rem' }}>{valor}</p>
            )}
            <p style={{ fontSize: 12, color: '#8A8A93', lineHeight: 1.6 }}>
              Seu pagamento foi recebido com sucesso. A Clínica Forma &amp; Função entrará em contato para confirmar o agendamento ou próximos passos.
            </p>
          </>
        ) : (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(251,191,36,0.1)',
              border: '2px solid rgba(251,191,36,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: 28,
            }}>
              ⚠
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, color: '#F5F2EA', fontWeight: 500, marginBottom: '1rem' }}>
              Aguardando confirmação
            </h1>
            <p style={{ fontSize: 12, color: '#8A8A93', lineHeight: 1.6 }}>
              O pagamento ainda não foi confirmado. Se você acabou de pagar, aguarde alguns instantes e atualize a página.
            </p>
          </>
        )}

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: 11, color: '#4A4A53' }}>Clínica Forma &amp; Função · Balneário Camboriú/SC</p>
        </div>
      </div>
    </div>
  );
}
