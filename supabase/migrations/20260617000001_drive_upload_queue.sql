-- Fila de reenvio para arquivos que falharam ao subir para o Google Drive
CREATE TABLE IF NOT EXISTS drive_upload_queue (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo           TEXT NOT NULL CHECK (tipo IN ('contrato', 'documento_paciente')),
  referencia_id  UUID NOT NULL,
  paciente_id    UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  paciente_nome  TEXT NOT NULL,
  paciente_cpf   TEXT NOT NULL,
  subpasta       TEXT NOT NULL,
  nome_arquivo   TEXT NOT NULL,
  mime_type      TEXT NOT NULL DEFAULT 'application/pdf',
  storage_path   TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'erro')),
  tentativas     INTEGER NOT NULL DEFAULT 0,
  erro_detalhe   TEXT,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  enviado_em     TIMESTAMPTZ
);

ALTER TABLE drive_upload_queue ENABLE ROW LEVEL SECURITY;

-- Somente admins leem/escrevem a fila (é interna, o cron usa service role)
DROP POLICY IF EXISTS "admin_drive_queue" ON drive_upload_queue;
CREATE POLICY "admin_drive_queue" ON drive_upload_queue
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Índice para o cron buscar pendentes rapidamente
CREATE INDEX IF NOT EXISTS idx_drive_queue_status ON drive_upload_queue (status, tentativas, criado_em);

-- Adicionar coluna drive_url em contratos (se não existir)
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS drive_file_url TEXT;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS drive_folder_url TEXT;

-- Adicionar colunas drive em documentos_paciente (se a tabela existir)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documentos_paciente') THEN
    ALTER TABLE documentos_paciente ADD COLUMN IF NOT EXISTS drive_file_id TEXT;
    ALTER TABLE documentos_paciente ADD COLUMN IF NOT EXISTS drive_file_url TEXT;
    ALTER TABLE documentos_paciente ADD COLUMN IF NOT EXISTS drive_folder_url TEXT;
    ALTER TABLE documentos_paciente ADD COLUMN IF NOT EXISTS drive_status TEXT DEFAULT 'pendente'
      CHECK (drive_status IN ('pendente', 'enviado', 'erro'));
  END IF;
END $$;
