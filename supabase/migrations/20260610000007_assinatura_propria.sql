-- Assinatura digital própria (sem API externa)
-- Substitui integração Assinafy; mantém pdf_signed_url, visualizado_em, recusado_em do migration anterior

-- Remover colunas específicas do Assinafy (se existirem)
ALTER TABLE contratos
  DROP COLUMN IF EXISTS assinafy_doc_id,
  DROP COLUMN IF EXISTS assinafy_signer_id,
  DROP COLUMN IF EXISTS sign_url,
  DROP COLUMN IF EXISTS external_id;

-- Adicionar colunas de assinatura própria
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS sign_token        TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS sign_token_exp    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sign_token_hmac   TEXT,
  ADD COLUMN IF NOT EXISTS signer_nome       TEXT,
  ADD COLUMN IF NOT EXISTS signer_cpf        TEXT,
  ADD COLUMN IF NOT EXISTS signer_ip         TEXT,
  ADD COLUMN IF NOT EXISTS signer_user_agent TEXT,
  ADD COLUMN IF NOT EXISTS signer_lat        NUMERIC,
  ADD COLUMN IF NOT EXISTS signer_lng        NUMERIC,
  ADD COLUMN IF NOT EXISTS signature_svg     TEXT,
  ADD COLUMN IF NOT EXISTS doc_hash          TEXT,
  ADD COLUMN IF NOT EXISTS recusa_motivo     TEXT;

-- Colunas já adicionadas em migration anterior (usar IF NOT EXISTS por segurança)
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS pdf_signed_url  TEXT,
  ADD COLUMN IF NOT EXISTS visualizado_em  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recusado_em     TIMESTAMPTZ;

-- Índice para lookup rápido por token (chamado a cada abertura do link)
CREATE INDEX IF NOT EXISTS idx_contratos_sign_token ON contratos(sign_token);

-- Tabela de controle de tentativas (rate limiting por IP)
CREATE TABLE IF NOT EXISTS signing_attempts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ip           TEXT        NOT NULL,
  token        TEXT        NOT NULL,
  tentativa_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_signing_attempts_ip_ts ON signing_attempts(ip, tentativa_em);

-- RLS em signing_attempts (somente service role insere via route handler)
ALTER TABLE signing_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "signing_attempts_insert" ON signing_attempts
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "signing_attempts_select" ON signing_attempts
  FOR SELECT TO authenticated USING (true);

-- Buckets de Storage (criar manualmente no painel Supabase caso não existam):
--   contratos-html     → privado  → armazena HTML original antes da assinatura
--   contratos-assinados → privado → armazena PDFs assinados
-- Comando equivalente (executar no SQL Editor do Supabase):
-- INSERT INTO storage.buckets (id, name, public) VALUES
--   ('contratos-html', 'contratos-html', false),
--   ('contratos-assinados', 'contratos-assinados', false)
-- ON CONFLICT DO NOTHING;

-- RLS no storage (service role tem acesso irrestrito; usuários autenticados podem ler)
-- Adicionar no Supabase Storage > Policies:
--   contratos-html: SELECT autenticado (para renderizar preview)
--   contratos-assinados: SELECT autenticado
