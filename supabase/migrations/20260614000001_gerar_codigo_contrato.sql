-- Fix: função gerar_codigo_contrato estava ausente, causando erro na geração de contratos

CREATE SEQUENCE IF NOT EXISTS contratos_seq;

CREATE OR REPLACE FUNCTION gerar_codigo_contrato()
RETURNS text LANGUAGE sql AS $$
  SELECT 'CTR-' || to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'YYYY') || '-' ||
         lpad(nextval('contratos_seq')::text, 5, '0');
$$;
