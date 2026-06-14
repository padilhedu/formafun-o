-- QA fix (auth-04 / auth-05): RLS por papel e por dono.
--
-- Problema: tabelas de prontuário/comercial/financeiro usavam a policy
-- permissiva auth.role() = 'authenticated' (qualquer autenticado faz tudo).
-- Como o paciente do portal também é um usuário `authenticated` (magic link via
-- portal_acessos), ele podia ler dados de TODOS os pacientes (cross-tenant).
--
-- Correção:
--   * Staff (admin/recepção) mantém acesso total (ALL).
--   * Paciente do portal só enxerga as PRÓPRIAS linhas (apenas SELECT, e só nas
--     tabelas que o portal realmente consome).
--   * Tabelas sensíveis que o portal não consome direto ficam staff-only.

-- ───────────────────────── Helpers (SECURITY DEFINER) ─────────────────────────

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','recepcao')
  );
$$;

create or replace function public.is_meu_paciente(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.portal_acessos
    where user_id = auth.uid() and habilitado = true and paciente_id = pid
  );
$$;

grant execute on function public.is_staff() to authenticated, anon;
grant execute on function public.is_meu_paciente(uuid) to authenticated, anon;

-- ──────────────── Tabelas: staff (ALL) + paciente (SELECT próprio) ─────────────

-- pacientes (vínculo = id)
drop policy if exists "pacientes_auth" on public.pacientes;
create policy "pacientes_staff" on public.pacientes
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "pacientes_portal_select" on public.pacientes
  for select to authenticated using (public.is_meu_paciente(id));

-- agenda_eventos (vínculo = paciente_id)
drop policy if exists "agenda_autenticado" on public.agenda_eventos;
create policy "agenda_staff" on public.agenda_eventos
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "agenda_portal_select" on public.agenda_eventos
  for select to authenticated using (public.is_meu_paciente(paciente_id));

-- orcamentos (vínculo = paciente_id)
drop policy if exists "Authenticated manage orcamentos" on public.orcamentos;
create policy "orcamentos_staff" on public.orcamentos
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "orcamentos_portal_select" on public.orcamentos
  for select to authenticated using (public.is_meu_paciente(paciente_id));

-- orcamento_itens (vínculo = via orcamento)
drop policy if exists "Authenticated manage orcamento_itens" on public.orcamento_itens;
create policy "orcamento_itens_staff" on public.orcamento_itens
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "orcamento_itens_portal_select" on public.orcamento_itens
  for select to authenticated using (
    exists (
      select 1 from public.orcamentos o
      where o.id = orcamento_itens.orcamento_id
        and public.is_meu_paciente(o.paciente_id)
    )
  );

-- contratos (vínculo = paciente_id)
drop policy if exists "Authenticated manage contratos" on public.contratos;
create policy "contratos_staff" on public.contratos
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "contratos_portal_select" on public.contratos
  for select to authenticated using (public.is_meu_paciente(paciente_id));

-- ──────────────────────────── Tabelas: staff-only ─────────────────────────────

-- anamneses
drop policy if exists "anamneses_auth" on public.anamneses;
create policy "anamneses_staff" on public.anamneses
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- evolucoes
drop policy if exists "evolucoes_auth" on public.evolucoes;
create policy "evolucoes_staff" on public.evolucoes
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- odontogramas (substitui as 3 policies de "Authenticated users can ...")
drop policy if exists "Authenticated users can read odontogramas" on public.odontogramas;
drop policy if exists "Authenticated users can insert odontogramas" on public.odontogramas;
drop policy if exists "Authenticated users can update odontogramas" on public.odontogramas;
create policy "odontogramas_staff" on public.odontogramas
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- documentos_paciente
drop policy if exists "documentos_auth" on public.documentos_paciente;
create policy "documentos_staff" on public.documentos_paciente
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- contas_receber (substitui receber_insert/select/update)
drop policy if exists "receber_insert" on public.contas_receber;
drop policy if exists "receber_select" on public.contas_receber;
drop policy if exists "receber_update" on public.contas_receber;
create policy "contas_receber_staff" on public.contas_receber
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- contas_pagar (substitui pagar_insert/select/update/delete)
drop policy if exists "pagar_insert" on public.contas_pagar;
drop policy if exists "pagar_select" on public.contas_pagar;
drop policy if exists "pagar_update" on public.contas_pagar;
drop policy if exists "pagar_delete" on public.contas_pagar;
create policy "contas_pagar_staff" on public.contas_pagar
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
