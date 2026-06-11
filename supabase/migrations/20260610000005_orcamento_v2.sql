-- Phase: Orçamento v2 — novos campos e tabela modelos_pagamento

-- 1. Novos campos em orcamentos
ALTER TABLE orcamentos
  ADD COLUMN IF NOT EXISTS convenio TEXT DEFAULT 'Particular',
  ADD COLUMN IF NOT EXISTS sessoes_previstas INTEGER,
  ADD COLUMN IF NOT EXISTS observacao_interna TEXT,
  ADD COLUMN IF NOT EXISTS desconto_motivo TEXT,
  ADD COLUMN IF NOT EXISTS clausulas_adicionais TEXT,
  ADD COLUMN IF NOT EXISTS data_avaliacao DATE;

-- 2. Novos campos em orcamento_itens
ALTER TABLE orcamento_itens
  ADD COLUMN IF NOT EXISTS selecionado BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS fixado BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Flag servico_fixo em procedimentos_tabela
ALTER TABLE procedimentos_tabela
  ADD COLUMN IF NOT EXISTS servico_fixo BOOLEAN NOT NULL DEFAULT FALSE;

-- 4. Tabela modelos_pagamento
CREATE TABLE IF NOT EXISTS modelos_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  entrada_percentual NUMERIC(5,2) NOT NULL DEFAULT 0,
  parcelas INTEGER NOT NULL DEFAULT 1,
  juros_percentual NUMERIC(5,2) NOT NULL DEFAULT 0,
  desconto_avista_percentual NUMERIC(5,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE modelos_pagamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modelos_select" ON modelos_pagamento FOR SELECT TO authenticated USING (true);
CREATE POLICY "modelos_insert" ON modelos_pagamento FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "modelos_update" ON modelos_pagamento FOR UPDATE TO authenticated USING (true);

-- Seeds
INSERT INTO modelos_pagamento (nome, entrada_percentual, parcelas, juros_percentual, desconto_avista_percentual) VALUES
  ('À vista −10%',      0, 1,  0,    10),
  ('3x sem juros',      0, 3,  0,    0),
  ('6x sem juros',      0, 6,  0,    0),
  ('12x com juros',     0, 12, 1.99, 0)
ON CONFLICT DO NOTHING;

-- 5. FK modelo_pagamento_id em orcamentos
ALTER TABLE orcamentos
  ADD COLUMN IF NOT EXISTS modelo_pagamento_id UUID REFERENCES modelos_pagamento(id);
