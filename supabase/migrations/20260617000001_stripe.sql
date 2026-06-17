-- Bloco 5: campos Stripe

-- Identificador do cliente Stripe (criado na primeira cobrança)
ALTER TABLE pacientes
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Sessão de checkout Stripe criada para esta conta a receber
ALTER TABLE contas_receber
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Índice para lookup rápido no webhook (charge.refunded)
CREATE INDEX IF NOT EXISTS idx_contas_receber_stripe_pi
  ON contas_receber (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
