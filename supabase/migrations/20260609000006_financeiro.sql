-- Fase 6: Financeiro (contas a receber / pagar) + Vindi

-- Vindi customer id no paciente
alter table pacientes add column if not exists vindi_customer_id text;

-- ============ CONTAS A RECEBER ============
create sequence if not exists contas_receber_seq;

create or replace function gerar_codigo_receber()
returns text language sql as $$
  select 'REC-' || to_char(now() at time zone 'America/Sao_Paulo', 'YYYY') || '-' ||
         lpad(nextval('contas_receber_seq')::text, 5, '0');
$$;

create table if not exists contas_receber (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  paciente_id uuid references pacientes(id),
  orcamento_id uuid references orcamentos(id),
  descricao text not null,
  parcela_num int not null default 1,
  parcela_total int not null default 1,
  valor numeric(12,2) not null,
  vencimento date not null,
  status text not null default 'pendente' check (status in ('pendente','pago','vencido','cancelado')),
  forma_pagamento text check (forma_pagamento in ('pix','cartao_credito','cartao_debito','boleto','dinheiro','transferencia')),
  pago_em timestamptz,
  valor_pago numeric(12,2),
  vindi_bill_id text,
  vindi_charge_id text,
  vindi_url text,
  observacoes text,
  criado_por uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_receber_paciente on contas_receber(paciente_id);
create index if not exists idx_receber_orcamento on contas_receber(orcamento_id);
create index if not exists idx_receber_status on contas_receber(status);
create index if not exists idx_receber_vencimento on contas_receber(vencimento);

alter table contas_receber enable row level security;
create policy "receber_select" on contas_receber for select to authenticated using (true);
create policy "receber_insert" on contas_receber for insert to authenticated with check (true);
create policy "receber_update" on contas_receber for update to authenticated using (true);

-- ============ CONTAS A PAGAR ============
create table if not exists contas_pagar (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  categoria text not null default 'outros' check (categoria in ('fornecedor','laboratorio','aluguel','salarios','impostos','materiais','equipamentos','marketing','servicos','outros')),
  fornecedor text,
  valor numeric(12,2) not null,
  vencimento date not null,
  status text not null default 'pendente' check (status in ('pendente','pago','vencido','cancelado')),
  pago_em timestamptz,
  valor_pago numeric(12,2),
  forma_pagamento text,
  recorrente boolean not null default false,
  observacoes text,
  criado_por uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pagar_status on contas_pagar(status);
create index if not exists idx_pagar_vencimento on contas_pagar(vencimento);

alter table contas_pagar enable row level security;
create policy "pagar_select" on contas_pagar for select to authenticated using (true);
create policy "pagar_insert" on contas_pagar for insert to authenticated with check (true);
create policy "pagar_update" on contas_pagar for update to authenticated using (true);
create policy "pagar_delete" on contas_pagar for delete to authenticated using (true);

-- updated_at triggers
create or replace function set_financeiro_updated()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_receber_updated on contas_receber;
create trigger trg_receber_updated before update on contas_receber
  for each row execute function set_financeiro_updated();

drop trigger if exists trg_pagar_updated on contas_pagar;
create trigger trg_pagar_updated before update on contas_pagar
  for each row execute function set_financeiro_updated();
