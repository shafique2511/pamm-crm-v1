-- noinspection SqlNoDataSourceInspection

-- Production-oriented Supabase/PostgreSQL schema for the simple proportional PAMM model.
-- This is a draft migration. Review against existing production data before running.

create type public.manager_role as enum ('super_admin', 'manager');
create type public.investor_status as enum ('active', 'suspended', 'closed');
create type public.transaction_status as enum ('pending', 'completed', 'rejected', 'cancelled');
create type public.capital_transaction_type as enum ('deposit', 'withdrawal', 'correction');
create type public.wallet_entry_type as enum ('performance_fee_credit', 'manager_withdrawal_debit', 'manual_adjustment');
create type public.sync_status as enum ('started', 'success', 'failed', 'partial');
create type public.ib_commission_source as enum ('performance_fee', 'deposit', 'custom');
create type public.ib_commission_status as enum ('pending', 'approved', 'paid', 'void');
create type public.ib_payout_status as enum ('pending', 'approved', 'rejected', 'paid');

create table if not exists public.manager_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  role public.manager_role not null default 'manager',
  brand_name text,
  logo_url text,
  support_email text,
  timezone text not null default 'UTC',
  statement_footer text,
  base_currency text not null default 'USD',
  default_fee_percent numeric(9,6) not null default 0.300000,
  default_ib_rate numeric(9,6) not null default 0.050000,
  ib_payout_approval_required boolean not null default true,
  referral_code_lock_enabled boolean not null default true,
  lock_financial_edits_after_rollover boolean not null default true,
  require_capital_approval boolean not null default true,
  audit_retention_days integer not null default 365,
  myfxbook_proxy_url text,
  ftp_proxy_url text,
  whatsapp_template text,
  telegram_template text,
  dashboard_reporting_period text not null default 'month',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investor_profiles (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.manager_profiles(id) on delete cascade,
  user_id uuid unique references auth.users(id) on delete set null,
  investor_name text not null,
  status public.investor_status not null default 'active',
  investor_group text,
  base_currency text not null default 'USD',
  performance_fee_percent numeric(9,6) not null default 0.300000,
  high_water_mark numeric(20,6) not null default 0,
  email text,
  phone text,
  country text,
  address text,
  bank_account text,
  referred_by text,
  referral_code text,
  ib_commission_rate numeric(9,6),
  email_notifications boolean not null default false,
  whatsapp_notifications boolean not null default false,
  telegram_notifications boolean not null default false,
  statement_delivery text not null default 'portal',
  date_format text not null default 'MM/DD/YYYY',
  privacy_consent_at timestamptz,
  risk_disclaimer_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (performance_fee_percent >= 0),
  check (ib_commission_rate is null or ib_commission_rate >= 0),
  check (statement_delivery in ('portal', 'email', 'whatsapp', 'telegram')),
  check (date_format in ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'))
);

create table if not exists public.ib_referral_codes (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.manager_profiles(id) on delete cascade,
  ib_name text not null,
  referral_code text not null,
  commission_rate numeric(9,6),
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (manager_id, referral_code),
  check (commission_rate is null or commission_rate >= 0)
);

create table if not exists public.capital_transactions (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.manager_profiles(id) on delete cascade,
  investor_id uuid not null references public.investor_profiles(id) on delete cascade,
  type public.capital_transaction_type not null,
  status public.transaction_status not null default 'pending',
  amount numeric(20,6) not null check (amount > 0),
  effective_at timestamptz not null,
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  reference_id text,
  method text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.period_history (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.manager_profiles(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  gross_pnl numeric(20,6) not null,
  status text not null default 'open',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  unique (manager_id, period_start, period_end),
  check (period_end > period_start)
);

create table if not exists public.profit_distributions (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.period_history(id) on delete cascade,
  manager_id uuid not null references public.manager_profiles(id) on delete cascade,
  investor_id uuid not null references public.investor_profiles(id) on delete cascade,
  starting_capital numeric(20,6) not null,
  investor_share numeric(20,12) not null,
  gross_pnl numeric(20,6) not null,
  performance_fee numeric(20,6) not null default 0,
  net_pnl numeric(20,6) not null,
  ending_capital numeric(20,6) not null,
  previous_high_water_mark numeric(20,6) not null,
  new_high_water_mark numeric(20,6) not null,
  rounding_adjustment numeric(20,6) not null default 0,
  created_at timestamptz not null default now(),
  unique (period_id, investor_id)
);

create table if not exists public.fee_ledger (
  id uuid primary key default gen_random_uuid(),
  period_id uuid references public.period_history(id) on delete set null,
  manager_id uuid not null references public.manager_profiles(id) on delete cascade,
  investor_id uuid references public.investor_profiles(id) on delete set null,
  amount numeric(20,6) not null check (amount >= 0),
  type text not null default 'performance_fee',
  created_at timestamptz not null default now()
);

create table if not exists public.manager_wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.manager_profiles(id) on delete cascade,
  period_id uuid references public.period_history(id) on delete set null,
  type public.wallet_entry_type not null,
  amount numeric(20,6) not null check (amount >= 0),
  created_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.ib_commission_ledger (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.manager_profiles(id) on delete cascade,
  ib_referral_code_id uuid references public.ib_referral_codes(id) on delete set null,
  ib_name text not null,
  investor_id uuid not null references public.investor_profiles(id) on delete restrict,
  period_id uuid references public.period_history(id) on delete set null,
  source public.ib_commission_source not null default 'performance_fee',
  base_amount numeric(20,6) not null check (base_amount >= 0),
  commission_rate numeric(9,6) not null check (commission_rate >= 0),
  commission_amount numeric(20,6) not null check (commission_amount >= 0),
  status public.ib_commission_status not null default 'approved',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (manager_id, investor_id, period_id, source)
);

create table if not exists public.ib_payout_requests (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.manager_profiles(id) on delete cascade,
  ib_referral_code_id uuid references public.ib_referral_codes(id) on delete set null,
  ib_name text not null,
  amount numeric(20,6) not null check (amount > 0),
  status public.ib_payout_status not null default 'pending',
  requested_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  paid_by uuid references auth.users(id) on delete set null,
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  notes text
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.manager_profiles(id) on delete cascade,
  external_trade_id text,
  source text not null default 'manual',
  ticket text,
  symbol text not null,
  type text not null check (type in ('buy', 'sell')),
  volume numeric(20,6) not null default 0,
  open_time timestamptz,
  close_time timestamptz,
  open_price numeric(20,8),
  close_price numeric(20,8),
  profit numeric(20,6) not null default 0,
  commission numeric(20,6) not null default 0,
  swap numeric(20,6) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  unique (manager_id, external_trade_id)
);

create table if not exists public.statement_snapshots (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.manager_profiles(id) on delete cascade,
  investor_id uuid not null references public.investor_profiles(id) on delete cascade,
  period_id uuid references public.period_history(id) on delete set null,
  statement_number text not null,
  payload jsonb not null,
  generated_by uuid references auth.users(id) on delete set null,
  generated_at timestamptz not null default now(),
  pdf_storage_path text,
  shared_whatsapp_at timestamptz,
  shared_telegram_at timestamptz,
  unique (manager_id, statement_number)
);

create table if not exists public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.manager_profiles(id) on delete cascade,
  provider text not null check (provider in ('mt5', 'myfxbook', 'ftp_report')),
  status public.sync_status not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_seen integer not null default 0,
  records_inserted integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid references public.manager_profiles(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists investor_profiles_manager_idx on public.investor_profiles (manager_id);
create index if not exists investor_profiles_referral_idx on public.investor_profiles (manager_id, referred_by) where referred_by is not null;
create index if not exists ib_referral_codes_manager_idx on public.ib_referral_codes (manager_id, referral_code) where is_active;
create index if not exists capital_transactions_manager_status_idx on public.capital_transactions (manager_id, status, effective_at);
create index if not exists capital_transactions_investor_idx on public.capital_transactions (investor_id, status, effective_at);
create index if not exists profit_distributions_period_idx on public.profit_distributions (period_id);
create index if not exists fee_ledger_manager_idx on public.fee_ledger (manager_id, created_at desc);
create index if not exists manager_wallet_ledger_manager_idx on public.manager_wallet_ledger (manager_id, created_at desc);
create index if not exists ib_commission_ledger_manager_idx on public.ib_commission_ledger (manager_id, ib_name, created_at desc);
create index if not exists ib_payout_requests_manager_idx on public.ib_payout_requests (manager_id, status, requested_at desc);
create index if not exists trades_manager_close_idx on public.trades (manager_id, close_time desc);
create index if not exists statement_snapshots_investor_idx on public.statement_snapshots (investor_id, generated_at desc);
create index if not exists sync_logs_manager_idx on public.sync_logs (manager_id, started_at desc);
create index if not exists audit_logs_manager_idx on public.audit_logs (manager_id, created_at desc);

create or replace function public.current_manager_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.manager_profiles where user_id = (select auth.uid()) limit 1;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.manager_profiles
    where user_id = (select auth.uid()) and role = 'super_admin'
  );
$$;

alter table public.manager_profiles enable row level security;
alter table public.investor_profiles enable row level security;
alter table public.capital_transactions enable row level security;
alter table public.ib_referral_codes enable row level security;
alter table public.period_history enable row level security;
alter table public.profit_distributions enable row level security;
alter table public.fee_ledger enable row level security;
alter table public.manager_wallet_ledger enable row level security;
alter table public.ib_commission_ledger enable row level security;
alter table public.ib_payout_requests enable row level security;
alter table public.trades enable row level security;
alter table public.statement_snapshots enable row level security;
alter table public.sync_logs enable row level security;
alter table public.audit_logs enable row level security;

create policy manager_profiles_read on public.manager_profiles
for select using ((select public.is_super_admin()) or user_id = (select auth.uid()));

create policy investor_profiles_read on public.investor_profiles
for select using (
  (select public.is_super_admin())
  or manager_id = (select public.current_manager_id())
  or user_id = (select auth.uid())
);

create policy capital_transactions_read on public.capital_transactions
for select using (
  (select public.is_super_admin())
  or manager_id = (select public.current_manager_id())
  or investor_id in (select id from public.investor_profiles where user_id = (select auth.uid()))
);

create policy ib_referral_codes_manager_read on public.ib_referral_codes
for select using ((select public.is_super_admin()) or manager_id = (select public.current_manager_id()));

create policy manager_owned_periods_read on public.period_history
for select using ((select public.is_super_admin()) or manager_id = (select public.current_manager_id()));

create policy manager_owned_distributions_read on public.profit_distributions
for select using (
  (select public.is_super_admin())
  or manager_id = (select public.current_manager_id())
  or investor_id in (select id from public.investor_profiles where user_id = (select auth.uid()))
);

create policy manager_owned_fee_ledger_read on public.fee_ledger
for select using ((select public.is_super_admin()) or manager_id = (select public.current_manager_id()));

create policy manager_owned_wallet_read on public.manager_wallet_ledger
for select using ((select public.is_super_admin()) or manager_id = (select public.current_manager_id()));

create policy ib_commission_ledger_manager_read on public.ib_commission_ledger
for select using ((select public.is_super_admin()) or manager_id = (select public.current_manager_id()));

create policy ib_payout_requests_manager_read on public.ib_payout_requests
for select using ((select public.is_super_admin()) or manager_id = (select public.current_manager_id()));

create policy manager_owned_trades_read on public.trades
for select using ((select public.is_super_admin()) or manager_id = (select public.current_manager_id()));

create policy statement_snapshots_read on public.statement_snapshots
for select using (
  (select public.is_super_admin())
  or manager_id = (select public.current_manager_id())
  or investor_id in (select id from public.investor_profiles where user_id = (select auth.uid()))
);

create policy sync_logs_manager_read on public.sync_logs
for select using ((select public.is_super_admin()) or manager_id = (select public.current_manager_id()));

create policy audit_logs_manager_read on public.audit_logs
for select using ((select public.is_super_admin()) or manager_id = (select public.current_manager_id()));
