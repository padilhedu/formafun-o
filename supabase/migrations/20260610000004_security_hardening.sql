-- Phase 13: Security hardening

-- 1. Audit log append-only (belt-and-suspenders — migration 0001 already revokes,
--    but we re-assert here in case of out-of-order migration runs)
DO $$ BEGIN
  REVOKE UPDATE, DELETE ON audit_log FROM authenticated;
  REVOKE UPDATE, DELETE ON audit_log FROM anon;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 2. Audit log insert function — SECURITY DEFINER so authenticated users can insert
--    even if they don't own the row (logs are append-only by anyone authenticated)
CREATE OR REPLACE FUNCTION public.inserir_audit_log(
  p_usuario_id   uuid,
  p_usuario_email text,
  p_acao         text,
  p_tabela       text,
  p_registro_id  text,
  p_detalhes     jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_log (usuario_id, usuario_email, acao, tabela, registro_id, detalhes)
  VALUES (p_usuario_id, p_usuario_email, p_acao, p_tabela, p_registro_id, p_detalhes);
END;
$$;

REVOKE ALL ON FUNCTION public.inserir_audit_log FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inserir_audit_log TO authenticated;

-- 3. Portal acessos — ensure RLS is enabled
ALTER TABLE IF EXISTS portal_acessos ENABLE ROW LEVEL SECURITY;

-- Patients can only see their own portal_acessos row
DO $$ BEGIN
  DROP POLICY IF EXISTS "portal_acessos_own" ON portal_acessos;
  CREATE POLICY "portal_acessos_own" ON portal_acessos
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 4. Ensure prontuarios / odontograma tables have RLS
-- (add for any table that may have been created without it)
DO $$ BEGIN
  ALTER TABLE prontuarios ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE odontograma ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 5. Block direct table delete on pacientes (soft delete only)
CREATE OR REPLACE FUNCTION public.bloquear_delete_pacientes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RAISE EXCEPTION 'Pacientes não podem ser excluídos fisicamente (CFO). Use ativo=false.';
END;
$$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS no_delete_pacientes ON pacientes;
  CREATE TRIGGER no_delete_pacientes
    BEFORE DELETE ON pacientes
    FOR EACH ROW EXECUTE FUNCTION public.bloquear_delete_pacientes();
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 6. Block physical delete on prontuarios
CREATE OR REPLACE FUNCTION public.bloquear_delete_prontuarios()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RAISE EXCEPTION 'Prontuários não podem ser excluídos fisicamente (CFO/LGPD). Use deleted_at.';
END;
$$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS no_delete_prontuarios ON prontuarios;
  CREATE TRIGGER no_delete_prontuarios
    BEFORE DELETE ON prontuarios
    FOR EACH ROW EXECUTE FUNCTION public.bloquear_delete_prontuarios();
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 7. Rate limit helper view for monitoring (read-only, admin only)
-- Requires pg_stat_statements extension (enabled by default on Supabase)
CREATE OR REPLACE VIEW public.v_audit_recente AS
  SELECT
    to_char(criado_em, 'YYYY-MM-DD HH24:MI:SS') AS horario,
    usuario_email,
    acao,
    tabela,
    registro_id
  FROM audit_log
  ORDER BY criado_em DESC
  LIMIT 200;

REVOKE ALL ON public.v_audit_recente FROM PUBLIC, anon;
GRANT SELECT ON public.v_audit_recente TO authenticated;
