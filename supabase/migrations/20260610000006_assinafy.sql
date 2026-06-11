-- Remove ZapSign, add Assinafy fields to contratos

-- Remove ZapSign columns if they exist
ALTER TABLE contratos
  DROP COLUMN IF EXISTS zapsign_doc_token,
  DROP COLUMN IF EXISTS zapsign_doc_url;

-- Add Assinafy columns
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS assinafy_doc_id    TEXT,
  ADD COLUMN IF NOT EXISTS assinafy_signer_id TEXT,
  ADD COLUMN IF NOT EXISTS sign_url           TEXT,
  ADD COLUMN IF NOT EXISTS pdf_signed_url     TEXT,
  ADD COLUMN IF NOT EXISTS visualizado_em     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recusado_em        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS external_id        TEXT UNIQUE;

-- Set external_id = id for existing contracts (idempotency)
UPDATE contratos SET external_id = id::text WHERE external_id IS NULL;

-- Storage bucket for signed PDFs (run manually in Supabase dashboard if not exists)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('contratos-assinados', 'contratos-assinados', false) ON CONFLICT DO NOTHING;

-- Notificacoes table (for internal alerts)
CREATE TABLE IF NOT EXISTS notificacoes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID REFERENCES auth.users,
  tipo        TEXT NOT NULL DEFAULT 'info',
  titulo      TEXT NOT NULL,
  corpo       TEXT,
  lida        BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "notif_select" ON notificacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "notif_insert" ON notificacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "notif_update" ON notificacoes FOR UPDATE TO authenticated USING (true);
