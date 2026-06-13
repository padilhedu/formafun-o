-- ============================================================
-- Migration retroativa: cobre Fases 2-11 que foram aplicadas
-- manualmente no banco sem versionamento.
-- Tudo usa IF NOT EXISTS / ADD COLUMN IF NOT EXISTS — idempotente.
-- NÃO remove dados existentes.
-- Aplicada em 2026-06-14 via Supabase MCP.
-- ============================================================

-- ── TABELA: configuracoes ────────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracoes (
  chave         TEXT PRIMARY KEY,
  valor         JSONB NOT NULL DEFAULT '{}',
  atualizado_por UUID REFERENCES auth.users(id),
  atualizado_em  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_read_configuracoes" ON configuracoes;
CREATE POLICY "staff_read_configuracoes" ON configuracoes
  FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin','recepcao')));
DROP POLICY IF EXISTS "admin_write_configuracoes" ON configuracoes;
CREATE POLICY "admin_write_configuracoes" ON configuracoes
  FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

INSERT INTO configuracoes (chave, valor) VALUES
  ('clinica',    '{"razao_social":"Forma & Função","nome_fantasia":"Forma & Função","cnpj":"","cro_clinica":"","endereco":"","cidade":"Balneário Camboriú","uf":"SC","telefone":"","email":"","responsavel_tecnico":"","cro_responsavel":""}'),
  ('agenda',     '{"inicio":"08:00","fim":"18:00","slot_minutos":30,"almoco_inicio":"12:00","almoco_fim":"13:00","antecedencia_min_horas":2}'),
  ('financeiro', '{"iss_aliquota":2,"iss_codigo_servico":"","regime_tributario":"simples","nota_automatica":false,"formas_pagamento":["dinheiro","pix","cartao_credito","cartao_debito","boleto"]}')
ON CONFLICT (chave) DO NOTHING;

-- ── TABELA: profissionais ────────────────────────────────────
CREATE TABLE IF NOT EXISTS profissionais (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                TEXT NOT NULL,
  cro                 TEXT,
  especialidade       TEXT,
  cor                 TEXT DEFAULT '#B89A5A',
  comissao_percentual NUMERIC(5,2) DEFAULT 0,
  ativo               BOOLEAN DEFAULT TRUE,
  criado_em           TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_profissionais" ON profissionais;
CREATE POLICY "staff_profissionais" ON profissionais
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin','recepcao')));

-- ── TABELA: notificacoes ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificacoes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  tipo       TEXT NOT NULL DEFAULT 'info',
  titulo     TEXT NOT NULL,
  corpo      TEXT,
  lida       BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notif_select" ON notificacoes;
CREATE POLICY "notif_select" ON notificacoes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "notif_insert" ON notificacoes;
CREATE POLICY "notif_insert" ON notificacoes FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "notif_update" ON notificacoes;
CREATE POLICY "notif_update" ON notificacoes FOR UPDATE TO authenticated USING (true);

-- ── TABELA: portal_acessos ───────────────────────────────────
CREATE TABLE IF NOT EXISTS portal_acessos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paciente_id    UUID NOT NULL REFERENCES pacientes(id),
  codigo_convite TEXT UNIQUE,
  convite_usado  BOOLEAN NOT NULL DEFAULT FALSE,
  habilitado     BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acesso  TIMESTAMPTZ,
  criado_em      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, paciente_id)
);
ALTER TABLE portal_acessos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_portal_acessos" ON portal_acessos;
CREATE POLICY "staff_portal_acessos" ON portal_acessos
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin','recepcao')));
DROP POLICY IF EXISTS "paciente_portal_acesso" ON portal_acessos;
CREATE POLICY "paciente_portal_acesso" ON portal_acessos
  FOR SELECT USING (auth.uid() = user_id);

-- ── TABELA: modelos_pagamento ────────────────────────────────
CREATE TABLE IF NOT EXISTS modelos_pagamento (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                       TEXT NOT NULL,
  entrada_percentual         NUMERIC(5,2) NOT NULL DEFAULT 0,
  parcelas                   INTEGER NOT NULL DEFAULT 1,
  juros_percentual           NUMERIC(5,2) NOT NULL DEFAULT 0,
  desconto_avista_percentual NUMERIC(5,2) NOT NULL DEFAULT 0,
  ativo                      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE modelos_pagamento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "modelos_select" ON modelos_pagamento;
CREATE POLICY "modelos_select" ON modelos_pagamento FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "modelos_insert" ON modelos_pagamento;
CREATE POLICY "modelos_insert" ON modelos_pagamento FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "modelos_update" ON modelos_pagamento;
CREATE POLICY "modelos_update" ON modelos_pagamento FOR UPDATE TO authenticated USING (true);
INSERT INTO modelos_pagamento (nome, entrada_percentual, parcelas, juros_percentual, desconto_avista_percentual) VALUES
  ('À vista −10%', 0, 1,  0,    10),
  ('3x sem juros',  0, 3,  0,    0),
  ('6x sem juros',  0, 6,  0,    0),
  ('12x com juros', 0, 12, 1.99, 0)
ON CONFLICT DO NOTHING;

-- ── TABELA: procedimento_documentos ─────────────────────────
CREATE TABLE IF NOT EXISTS procedimento_documentos (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_procedimento TEXT NOT NULL,
  template_id            UUID NOT NULL REFERENCES contratos_templates(id) ON DELETE CASCADE,
  obrigatorio            BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em              TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE procedimento_documentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_proc_docs" ON procedimento_documentos;
CREATE POLICY "staff_proc_docs" ON procedimento_documentos
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin','recepcao')));

-- ── COLUNAS: orcamento_itens (CRÍTICO — afeta gerar-link) ───
-- Sem selecionado: .filter(i => i.selecionado) retorna array vazio → contrato sem itens
ALTER TABLE orcamento_itens
  ADD COLUMN IF NOT EXISTS selecionado BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS fixado      BOOLEAN NOT NULL DEFAULT FALSE;

-- ── COLUNAS: orcamentos ──────────────────────────────────────
ALTER TABLE orcamentos
  ADD COLUMN IF NOT EXISTS convenio             TEXT DEFAULT 'Particular',
  ADD COLUMN IF NOT EXISTS sessoes_previstas    INTEGER,
  ADD COLUMN IF NOT EXISTS observacao_interna   TEXT,
  ADD COLUMN IF NOT EXISTS desconto_motivo      TEXT,
  ADD COLUMN IF NOT EXISTS clausulas_adicionais TEXT,
  ADD COLUMN IF NOT EXISTS data_avaliacao       DATE,
  ADD COLUMN IF NOT EXISTS modelo_pagamento_id  UUID REFERENCES modelos_pagamento(id);

-- ── COLUNAS: procedimentos_tabela ───────────────────────────
ALTER TABLE procedimentos_tabela
  ADD COLUMN IF NOT EXISTS servico_fixo BOOLEAN NOT NULL DEFAULT FALSE;

-- ── COLUNAS: contratos_templates ────────────────────────────
ALTER TABLE contratos_templates
  ADD COLUMN IF NOT EXISTS categoria_documento TEXT NOT NULL DEFAULT 'contrato',
  ADD COLUMN IF NOT EXISTS origem              TEXT NOT NULL DEFAULT 'sistema',
  ADD COLUMN IF NOT EXISTS versao              INT  NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS vigente             BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS arquivo_drive_id    TEXT;

-- ── COLUNAS: contratos ──────────────────────────────────────
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS travado             BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tcle                BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS versao_template     INT,
  ADD COLUMN IF NOT EXISTS categoria_documento TEXT DEFAULT 'contrato';

-- ── COLUNAS: pacientes (portal) ─────────────────────────────
ALTER TABLE pacientes
  ADD COLUMN IF NOT EXISTS portal_habilitado    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS portal_ultimo_acesso TIMESTAMPTZ;

-- ── COLUNAS: agenda_eventos (portal) ────────────────────────
ALTER TABLE agenda_eventos
  ADD COLUMN IF NOT EXISTS notas_publicas TEXT;

-- ── COLUNAS: audit_log ──────────────────────────────────────
ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS usuario_email TEXT;

-- ── FUNÇÃO: gerar_codigo_contrato ───────────────────────────
CREATE OR REPLACE FUNCTION public.gerar_codigo_contrato()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ano  TEXT := to_char(NOW(), 'YYYY');
  v_seq  BIGINT;
  v_code TEXT;
BEGIN
  SELECT COALESCE(
    MAX(CAST(NULLIF(regexp_replace(codigo, '\D','','g'),'') AS BIGINT)), 0
  ) + 1
    INTO v_seq
    FROM contratos
   WHERE codigo LIKE 'CTR-' || v_ano || '-%';
  v_code := 'CTR-' || v_ano || '-' || LPAD(v_seq::TEXT, 4, '0');
  RETURN v_code;
END;
$$;
GRANT EXECUTE ON FUNCTION public.gerar_codigo_contrato() TO authenticated;
