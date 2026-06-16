-- ============================================================
-- RLS: anamneses, evolucoes e correção da view portal_consultas
-- QA Lote 1 — AR-03 e AR-04
-- ============================================================

-- ── TABELA: anamneses ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS anamneses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  respostas   JSONB NOT NULL DEFAULT '{}',
  alertas     TEXT[] NOT NULL DEFAULT '{}',
  criada_por  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE anamneses ENABLE ROW LEVEL SECURITY;

-- Apenas admin/dentista pode ler e escrever anamneses (dado clínico sensível)
DROP POLICY IF EXISTS "clinico_anamneses" ON anamneses;
CREATE POLICY "clinico_anamneses" ON anamneses
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ── TABELA: evolucoes ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evolucoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id     UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  profissional_id UUID REFERENCES auth.users(id),
  procedimento    TEXT NOT NULL,
  dente           TEXT,
  descricao       TEXT,
  data            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE evolucoes ENABLE ROW LEVEL SECURITY;

-- Admin/dentista podem ler e escrever; recepcao só lê
DROP POLICY IF EXISTS "admin_evolucoes_rw" ON evolucoes;
CREATE POLICY "admin_evolucoes_rw" ON evolucoes
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "recepcao_evolucoes_r" ON evolucoes;
CREATE POLICY "recepcao_evolucoes_r" ON evolucoes
  FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'recepcao'));

-- ── VIEW: portal_consultas — defesa em profundidade ──────────
-- Adiciona filtro explícito pa.user_id = auth.uid() além do security_invoker,
-- garantindo que um paciente nunca veja consultas de outro mesmo se o RLS
-- de agenda_eventos for permissivo.
CREATE OR REPLACE VIEW portal_consultas AS
  SELECT
    ae.id,
    ae.inicio        AS data_hora,
    ae.status,
    ae.tipo,
    ae.notas_publicas,
    pa.user_id
  FROM agenda_eventos ae
  JOIN portal_acessos pa
    ON pa.paciente_id = ae.paciente_id
   AND pa.habilitado = TRUE
   AND pa.user_id = auth.uid()
  WHERE ae.paciente_id = (
    SELECT paciente_id FROM portal_acessos
    WHERE user_id = auth.uid() AND habilitado = TRUE
    LIMIT 1
  );

ALTER VIEW portal_consultas SET (security_invoker = TRUE);
