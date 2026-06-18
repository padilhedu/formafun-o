-- Fix: substitui regex bugada por sequence atômica
-- Problema anterior: regexp_replace stripava ano + sequência juntos,
-- causando colisão de código e 409 no INSERT.

CREATE SEQUENCE IF NOT EXISTS orcamento_seq_2026 START WITH 18;

CREATE OR REPLACE FUNCTION public.gerar_codigo_orcamento()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_ano  TEXT := to_char(NOW(), 'YYYY');
  v_seq  BIGINT;
  v_code TEXT;
BEGIN
  IF v_ano = '2026' THEN
    v_seq := nextval('orcamento_seq_2026');
  ELSE
    BEGIN
      EXECUTE format('CREATE SEQUENCE IF NOT EXISTS orcamento_seq_%s START WITH 1', v_ano);
    EXCEPTION WHEN duplicate_table THEN NULL;
    END;
    EXECUTE format('SELECT nextval(''orcamento_seq_%s'')', v_ano) INTO v_seq;
  END IF;

  v_code := 'ORC-' || v_ano || '-' || LPAD(v_seq::TEXT, 4, '0');
  RETURN v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.gerar_codigo_orcamento() TO authenticated;
