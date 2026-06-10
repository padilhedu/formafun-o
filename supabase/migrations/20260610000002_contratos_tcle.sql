-- Fase 11: Templates versionados + TCLE + vínculo procedimento-documento

-- Garantir que contratos_templates exista com campos da Fase 11
CREATE TABLE IF NOT EXISTS contratos_templates (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome               TEXT NOT NULL,
  tipo               TEXT NOT NULL DEFAULT 'prestacao_servico',
  categoria_documento TEXT NOT NULL DEFAULT 'contrato',  -- 'contrato' | 'tcle'
  origem             TEXT NOT NULL DEFAULT 'sistema',    -- 'sistema' | 'juridico'
  versao             INT NOT NULL DEFAULT 1,
  vigente            BOOLEAN NOT NULL DEFAULT TRUE,
  corpo_html         TEXT NOT NULL DEFAULT '',
  arquivo_drive_id   TEXT,
  ativo              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas faltantes se tabela já existia
DO $$ BEGIN
  ALTER TABLE contratos_templates ADD COLUMN categoria_documento TEXT NOT NULL DEFAULT 'contrato';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE contratos_templates ADD COLUMN origem TEXT NOT NULL DEFAULT 'sistema';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE contratos_templates ADD COLUMN versao INT NOT NULL DEFAULT 1;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE contratos_templates ADD COLUMN vigente BOOLEAN NOT NULL DEFAULT TRUE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE contratos_templates ADD COLUMN arquivo_drive_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

ALTER TABLE contratos_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_templates" ON contratos_templates;
CREATE POLICY "staff_templates" ON contratos_templates
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin','recepcao')));

-- Vínculo procedimento → documentos obrigatórios
CREATE TABLE IF NOT EXISTS procedimento_documentos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_procedimento TEXT NOT NULL,  -- categoria do procedimento (implante, cirurgia, etc.)
  template_id           UUID NOT NULL REFERENCES contratos_templates(id) ON DELETE CASCADE,
  obrigatorio           BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em             TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE procedimento_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_proc_docs" ON procedimento_documentos
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin','recepcao')));

-- Adicionar campos à tabela contratos
DO $$ BEGIN
  ALTER TABLE contratos ADD COLUMN tcle BOOLEAN NOT NULL DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE contratos ADD COLUMN versao_template INT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE contratos ADD COLUMN categoria_documento TEXT DEFAULT 'contrato';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Seeds: templates base (marcados para revisão jurídica)
INSERT INTO contratos_templates (nome, tipo, categoria_documento, origem, versao, vigente, corpo_html) VALUES
(
  'Contrato de Prestação de Serviços Odontológicos',
  'prestacao_servico', 'contrato', 'sistema', 1, TRUE,
  '<h2>CONTRATO DE PRESTAÇÃO DE SERVIÇOS ODONTOLÓGICOS</h2>
<p><strong>CONTRATANTE:</strong> {{paciente_nome}}, CPF {{paciente_cpf}}</p>
<p><strong>CONTRATADA:</strong> Clínica Forma &amp; Função Odontologia</p>
<h3>OBJETO</h3>
<p>O presente instrumento tem por objeto a prestação de serviços odontológicos conforme orçamento {{orcamento_codigo}}, no valor total de {{orcamento_total}}.</p>
<h3>PROCEDIMENTOS</h3>
{{itens_tabela}}
<h3>PAGAMENTO</h3>
<p>{{condicoes_pagamento}}</p>
<h3>DISPOSIÇÕES GERAIS</h3>
<p>O paciente declara estar ciente dos procedimentos a serem realizados e concorda com os termos deste contrato.</p>
<p>Balneário Camboriú, {{data_atual}}</p>
<br>
<p>_____________________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; _____________________________</p>
<p>CONTRATANTE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; CONTRATADA</p>
<p style="color:#999;font-size:0.8em">⚠️ REVISAR COM JURÍDICO ANTES DE USAR EM PRODUÇÃO</p>'
),
(
  'TCLE — Procedimento Odontológico Geral',
  'consentimento', 'tcle', 'sistema', 1, TRUE,
  '<h2>TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO</h2>
<p>Eu, <strong>{{paciente_nome}}</strong>, CPF {{paciente_cpf}}, declaro que fui devidamente informado(a) pelo(a) dentista sobre o procedimento a ser realizado, seus benefícios, riscos e alternativas de tratamento.</p>
<h3>RISCOS INDIVIDUALIZADOS</h3>
<p>[Espaço para descrição dos riscos específicos deste caso]</p>
<h3>CONSENTIMENTO</h3>
<p>Declaro meu consentimento livre e esclarecido para a realização do procedimento, podendo revogar este consentimento a qualquer momento antes de seu início.</p>
<p>Balneário Camboriú, {{data_atual}}</p>
<br>
<p>_____________________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; _____________________________</p>
<p>PACIENTE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; RESPONSÁVEL TÉCNICO</p>
<p style="color:#999;font-size:0.8em">⚠️ REVISAR COM JURÍDICO ANTES DE USAR EM PRODUÇÃO</p>'
),
(
  'TCLE — Implante Osseointegrado',
  'implante', 'tcle', 'sistema', 1, TRUE,
  '<h2>TERMO DE CONSENTIMENTO — IMPLANTE OSSEOINTEGRADO</h2>
<p>Eu, <strong>{{paciente_nome}}</strong>, CPF {{paciente_cpf}}, autorizo a realização de procedimento de instalação de implante osseointegrado.</p>
<h3>RISCOS INFORMADOS</h3>
<ul>
<li>Infecção pós-operatória</li><li>Falha de osseointegração</li><li>Dor e inchaço pós-cirurgia</li><li>Necessidade de nova intervenção</li>
</ul>
<h3>RISCOS INDIVIDUALIZADOS DO PACIENTE</h3>
<p>[Espaço para riscos específicos deste caso]</p>
<p>Balneário Camboriú, {{data_atual}}</p>
<p style="color:#999;font-size:0.8em">⚠️ REVISAR COM JURÍDICO ANTES DE USAR EM PRODUÇÃO</p>'
),
(
  'TCLE — Cirurgia Oral',
  'consentimento', 'tcle', 'sistema', 1, TRUE,
  '<h2>TERMO DE CONSENTIMENTO — CIRURGIA ORAL</h2>
<p>Eu, <strong>{{paciente_nome}}</strong>, autorizo a realização de procedimento cirúrgico oral, tendo sido informado dos riscos incluindo sangramento, infecção, parestesia temporária ou permanente e complicações anestésicas.</p>
<h3>RISCOS INDIVIDUALIZADOS</h3>
<p>[Espaço para riscos específicos]</p>
<p>Balneário Camboriú, {{data_atual}}</p>
<p style="color:#999;font-size:0.8em">⚠️ REVISAR COM JURÍDICO ANTES DE USAR EM PRODUÇÃO</p>'
),
(
  'Contrato de Tratamento Ortodôntico',
  'ortodontia', 'contrato', 'sistema', 1, TRUE,
  '<h2>CONTRATO DE TRATAMENTO ORTODÔNTICO</h2>
<p><strong>PACIENTE:</strong> {{paciente_nome}}, CPF {{paciente_cpf}}</p>
<h3>OBJETO</h3>
<p>Tratamento ortodôntico conforme orçamento {{orcamento_codigo}}, valor total {{orcamento_total}}.</p>
<h3>RESPONSABILIDADES DO PACIENTE</h3>
<ul><li>Comparecer às consultas de manutenção mensais</li><li>Manter higiene adequada</li><li>Avisar com antecedência caso não possa comparecer</li></ul>
<h3>PRAZO ESTIMADO</h3>
<p>O prazo de tratamento é estimado e pode variar conforme resposta biológica individual.</p>
<p>{{condicoes_pagamento}}</p>
<p>Balneário Camboriú, {{data_atual}}</p>
<p style="color:#999;font-size:0.8em">⚠️ REVISAR COM JURÍDICO ANTES DE USAR EM PRODUÇÃO</p>'
)
ON CONFLICT DO NOTHING;
