-- Etapa 0: adiciona colunas para templates baseados em upload de arquivo
-- Mantém corpo_html para retrocompatibilidade com templates HTML legados

ALTER TABLE contratos_templates
  ADD COLUMN IF NOT EXISTS arquivo_original_url text,
  ADD COLUMN IF NOT EXISTS arquivo_tipo         text CHECK (arquivo_tipo IN ('docx','pdf','html')),
  ADD COLUMN IF NOT EXISTS placeholders_detectados jsonb,
  ADD COLUMN IF NOT EXISTS preview_pdf_url      text,
  ADD COLUMN IF NOT EXISTS arquivo_estatico     boolean NOT NULL DEFAULT false;

-- Templates legados (corpo_html) ficam com arquivo_tipo = 'html'
UPDATE contratos_templates
SET arquivo_tipo = 'html'
WHERE arquivo_tipo IS NULL AND corpo_html IS NOT NULL AND corpo_html != '';

-- Bucket para arquivos originais de templates (docx/pdf)
-- Executar via Dashboard ou Supabase CLI se o bucket não existir:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('templates-originais', 'templates-originais', false);

-- Policy: staff pode ler/escrever
-- (Supabase Storage RLS habilitado por padrão; policies via Dashboard)
-- Exemplo:
-- CREATE POLICY "staff_read_templates" ON storage.objects
--   FOR SELECT USING (bucket_id = 'templates-originais' AND auth.role() = 'authenticated');
-- CREATE POLICY "staff_write_templates" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'templates-originais' AND auth.role() = 'authenticated');
