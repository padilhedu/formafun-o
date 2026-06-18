-- Cria a função gerar_codigo_orcamento que estava faltando.
-- Modela o mesmo padrão de gerar_codigo_contrato.

CREATE OR REPLACE FUNCTION public.gerar_codigo_orcamento()
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
    MAX(CAST(NULLIF(regexp_replace(codigo, '\D', '', 'g'), '') AS BIGINT)), 0
  ) + 1
    INTO v_seq
    FROM orcamentos
   WHERE codigo LIKE 'ORC-' || v_ano || '-%';

  v_code := 'ORC-' || v_ano || '-' || LPAD(v_seq::TEXT, 4, '0');
  RETURN v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.gerar_codigo_orcamento() TO authenticated;
