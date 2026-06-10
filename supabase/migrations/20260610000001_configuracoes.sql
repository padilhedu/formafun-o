-- Configurações da clínica (chave-valor)
CREATE TABLE IF NOT EXISTS configuracoes (
  chave TEXT PRIMARY KEY,
  valor JSONB NOT NULL DEFAULT '{}',
  atualizado_por UUID REFERENCES auth.users(id),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_read_configuracoes" ON configuracoes
  FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin','recepcao')));

CREATE POLICY "admin_write_configuracoes" ON configuracoes
  FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Profissionais da clínica
CREATE TABLE IF NOT EXISTS profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cro TEXT,
  especialidade TEXT,
  cor TEXT DEFAULT '#B89A5A',
  comissao_percentual NUMERIC(5,2) DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_profissionais" ON profissionais
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin','recepcao')));

CREATE POLICY "admin_write_profissionais" ON profissionais
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Catálogo de procedimentos
CREATE TABLE IF NOT EXISTS procedimentos_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT,
  nome TEXT NOT NULL,
  categoria TEXT,
  valor_padrao NUMERIC(12,2),
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE procedimentos_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_procedimentos_read" ON procedimentos_catalogo
  FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin','recepcao')));

CREATE POLICY "admin_procedimentos_write" ON procedimentos_catalogo
  FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Audit log (append-only — sem UPDATE/DELETE grants)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  usuario_email TEXT,
  acao TEXT NOT NULL,
  tabela TEXT,
  registro_id TEXT,
  dados JSONB,
  ip TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_audit" ON audit_log
  FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Revogar UPDATE e DELETE do audit_log para todos os roles
REVOKE UPDATE, DELETE ON audit_log FROM authenticated;
REVOKE UPDATE, DELETE ON audit_log FROM anon;

-- Seeds de configurações padrão
INSERT INTO configuracoes (chave, valor) VALUES
  ('clinica', '{"razao_social":"Forma & Função","nome_fantasia":"Forma & Função","cnpj":"","cro_clinica":"","endereco":"","cidade":"Balneário Camboriú","uf":"SC","telefone":"","email":"","responsavel_tecnico":"","cro_responsavel":""}'),
  ('agenda',  '{"inicio":"08:00","fim":"18:00","slot_minutos":30,"almoco_inicio":"12:00","almoco_fim":"13:00","antecedencia_min_horas":2}'),
  ('financeiro', '{"iss_aliquota":2,"iss_codigo_servico":"","regime_tributario":"simples","nota_automatica":false,"formas_pagamento":["dinheiro","pix","cartao_credito","cartao_debito","boleto"]}')
ON CONFLICT (chave) DO NOTHING;
