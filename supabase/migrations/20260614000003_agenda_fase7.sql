-- Fase 7: Agenda — completar schema e automação de lembretes

-- 1. Coluna whatsapp separada nos pacientes (campo preferencial para envio)
ALTER TABLE pacientes
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

-- 2. Habilitar pg_cron (extensão gerenciada — só funciona no plano Pro+)
-- Se não disponível, os lembretes são acionados manualmente via Edge Function HTTP.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Cron jobs de lembrete
--    D-1: todos os dias às 17h (Brasília = UTC-3 → 20:00 UTC)
--    D-0: todos os dias às 07h (Brasília → 10:00 UTC)
SELECT cron.schedule(
  'lembrete-d1',
  '0 20 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.url') || '/api/agenda/lembretes',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.cron_secret')
      ),
      body := '{}'::jsonb
    );
  $$
);

SELECT cron.schedule(
  'lembrete-d0',
  '0 10 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.url') || '/api/agenda/lembretes',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.cron_secret')
      ),
      body := '{}'::jsonb
    );
  $$
);
