-- Fix: RLS recursion infinita em profiles/configuracoes/profissionais
--
-- O problema: a policy profiles_select_admin consultava a própria tabela profiles
-- para checar o role, criando recursão infinita e bloqueando todas as queries
-- que dependiam de role (configuracoes, profissionais, etc.).
--
-- A solução: função SECURITY DEFINER que lê profiles como superuser (sem RLS),
-- eliminando a recursão. Padrão oficial do Supabase para este cenário.

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid();
$$;

-- profiles
DROP POLICY IF EXISTS profiles_select_admin ON profiles;
CREATE POLICY profiles_select_admin ON profiles
  FOR SELECT
  USING (get_my_role() = 'admin');

-- configuracoes
DROP POLICY IF EXISTS admin_write_configuracoes ON configuracoes;
DROP POLICY IF EXISTS staff_read_configuracoes ON configuracoes;

CREATE POLICY admin_write_configuracoes ON configuracoes
  FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY staff_read_configuracoes ON configuracoes
  FOR SELECT
  USING (get_my_role() IN ('admin', 'recepcao'));

-- profissionais
DROP POLICY IF EXISTS staff_profissionais ON profissionais;

CREATE POLICY staff_profissionais ON profissionais
  FOR ALL
  USING (get_my_role() IN ('admin', 'recepcao'));
