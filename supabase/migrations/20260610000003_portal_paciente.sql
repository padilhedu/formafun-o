-- Fase 12: Portal do Paciente

-- Tabela vinculando auth.users (paciente) ao paciente clínico
CREATE TABLE IF NOT EXISTS portal_acessos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paciente_id     UUID NOT NULL REFERENCES pacientes(id),
  codigo_convite  TEXT UNIQUE,
  convite_usado   BOOLEAN NOT NULL DEFAULT FALSE,
  habilitado      BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acesso   TIMESTAMPTZ,
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, paciente_id)
);

ALTER TABLE portal_acessos ENABLE ROW LEVEL SECURITY;

-- Staff pode gerenciar todos
CREATE POLICY "staff_portal_acessos" ON portal_acessos
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin','recepcao')));

-- Paciente vê apenas o próprio acesso
CREATE POLICY "paciente_portal_acesso" ON portal_acessos
  FOR SELECT USING (auth.uid() = user_id);

-- Views read-only para o portal (evita acesso direto às tabelas clínicas)
CREATE OR REPLACE VIEW portal_consultas AS
  SELECT
    ae.id,
    ae.data_hora,
    ae.duracao_minutos,
    ae.status,
    ae.tipo,
    ae.notas_publicas,
    pa.user_id
  FROM agenda_eventos ae
  JOIN portal_acessos pa ON pa.paciente_id = ae.paciente_id
  WHERE pa.habilitado = TRUE;

-- RLS na view via security_invoker
ALTER VIEW portal_consultas SET (security_invoker = TRUE);

-- Confirmar presença via agenda (única escrita permitida ao paciente)
-- Gerenciada por API route, não diretamente.

-- Campo portal_habilitado + botão convite no cadastro
DO $$ BEGIN
  ALTER TABLE pacientes ADD COLUMN portal_habilitado BOOLEAN NOT NULL DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE pacientes ADD COLUMN portal_ultimo_acesso TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- notas_publicas na agenda (visíveis ao paciente)
DO $$ BEGIN
  ALTER TABLE agenda_eventos ADD COLUMN notas_publicas TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
