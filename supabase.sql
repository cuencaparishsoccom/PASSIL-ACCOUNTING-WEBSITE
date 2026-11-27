-- SocCom Finance Portal database setup
-- Run in Supabase Dashboard > SQL Editor using a project owner account.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  username text,
  role text not null default 'pending' check (role in ('admin','staff','audit','finance_officer','treasurer','approver','viewer','pending')),
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists username text;
alter table public.profiles alter column role set default 'pending';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','staff','audit','finance_officer','treasurer','approver','viewer','pending'));
update public.profiles set role = 'pending' where role = 'audit' and username is null;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_username_format'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles add constraint profiles_username_format
      check (username is null or username ~ '^[a-z0-9._-]{3,32}$');
  end if;
end
$$;
create unique index if not exists profiles_username_ci_unique
  on public.profiles (lower(username)) where username is not null;
update public.profiles set role = 'staff' where role = 'treasurer';
update public.profiles set role = 'finance_officer' where role = 'approver';

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('cash_donation','in_kind_donation','income','disbursement','expense','cash_return','liquidation')),
  document_no text not null unique,
  transaction_date date not null,
  amount numeric(14,2) not null default 0 check (amount >= 0),
  funding_source text,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists transactions_date_idx on public.transactions(transaction_date desc);
create index if not exists transactions_kind_idx on public.transactions(kind);
create index if not exists transactions_fund_idx on public.transactions(funding_source);

create table if not exists public.donation_categories (
  name text primary key check (length(trim(name)) between 1 and 80),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
insert into public.donation_categories (name)
select category_name
from unnest(array[
  'General Cash Donations',
  'Camera Donations',
  'Microphone Donations',
  'Laptop Donations',
  'Computer Equipment Donations',
  'Other Equipment Donations'
]) as seeded(category_name)
where not exists (select 1 from public.donation_categories);

create table if not exists public.income_categories (
  name text primary key check (length(trim(name)) between 1 and 80),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
insert into public.income_categories (name)
select category_name
from unnest(array[
  'Sales',
  'Social Media Monetization',
  'Parish Allowance',
  'Collections',
  'Other Income'
]) as seeded(category_name)
where not exists (select 1 from public.income_categories)
on conflict (name) do nothing;
insert into public.income_categories (name)
select distinct trim(payload->>'category')
from public.transactions
where kind = 'income'
  and nullif(trim(payload->>'category'), '') is not null
on conflict (name) do nothing;

create table if not exists public.portal_settings (
  id text primary key default 'default' check (id = 'default'),
  system_settings jsonb not null default '{}'::jsonb check (jsonb_typeof(system_settings) = 'object'),
  templates jsonb not null default '{}'::jsonb check (jsonb_typeof(templates) = 'object'),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_counters (
  prefix text not null,
  document_year integer not null,
  last_value integer not null default 0,
  primary key (prefix, document_year)
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  transaction_id uuid not null,
  action text not null,
  actor_id uuid,
  occurred_at timestamptz not null default now(),
  old_record jsonb,
  new_record jsonb
);
create index if not exists audit_logs_transaction_idx on public.audit_logs(transaction_id);
create index if not exists audit_logs_occurred_idx on public.audit_logs(occurred_at desc);

create or replace function public.current_finance_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_finance_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_finance_role() = 'admin', false)
$$;

create or replace function public.bootstrap_finance_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_finance on auth.users;
create trigger on_auth_user_created_finance
after insert or update on auth.users
for each row execute function public.bootstrap_finance_profile();

create or replace function public.write_finance_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    insert into public.audit_logs (transaction_id, action, actor_id, old_record)
    values (old.id, tg_op, auth.uid(), to_jsonb(old));
    return old;
  end if;
  insert into public.audit_logs (transaction_id, action, actor_id, new_record, old_record)
  values (
    new.id,
    tg_op,
    auth.uid(),
    to_jsonb(new),
    case when tg_op = 'UPDATE' then to_jsonb(old) else null end
  );
  return new;
end;
$$;

drop trigger if exists transactions_audit_log on public.transactions;
create trigger transactions_audit_log
after insert or update or delete on public.transactions
for each row execute function public.write_finance_audit_log();

create or replace function public.create_transaction(
  p_kind text,
  p_transaction_date date,
  p_amount numeric,
  p_funding_source text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_prefix text;
  v_year integer;
  v_sequence integer;
  v_source text := nullif(trim(p_funding_source), '');
  v_amount numeric(14,2) := coalesce(p_amount, 0);
  v_balance numeric(14,2);
  v_tx public.transactions%rowtype;
  v_purpose text;
begin
  v_role := public.current_finance_role();
  if auth.uid() is null or coalesce(v_role, '') not in ('admin','staff','finance_officer','treasurer','approver') then
    raise exception 'Your account does not have permission to create financial records.';
  end if;
  if p_kind is null or p_kind not in ('cash_donation','in_kind_donation','income','disbursement','expense','cash_return','liquidation') then
    raise exception 'Unsupported transaction type.';
  end if;
  if p_transaction_date is null or v_amount < 0 or p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Enter a valid date, non-negative amount, and transaction details.';
  end if;
  if p_kind in ('cash_donation','income','disbursement','expense') and v_amount <= 0 then
    raise exception 'The transaction amount must be greater than zero.';
  end if;
  if p_kind = 'cash_donation' and nullif(trim(p_payload->>'received_by'), '') is null then
    raise exception 'Complete the required receipt details.';
  end if;
  if p_kind = 'income' and (
    nullif(trim(p_payload->>'received_from'), '') is null
    or not exists (select 1 from public.income_categories c where c.name = p_payload->>'category')
    or coalesce(p_payload->>'payment_method', '') not in ('Cash', 'Bank transfer', 'E-wallet', 'Check', 'Other')
    or nullif(trim(p_payload->>'particulars'), '') is null
    or nullif(trim(p_payload->>'prepared_by'), '') is null
    or nullif(trim(p_payload->>'checked_by'), '') is null
  ) then
    raise exception 'Complete the required income receipt details.';
  end if;
  if p_kind = 'in_kind_donation' and (
    nullif(trim(p_payload->>'donor_name'), '') is null
    or nullif(trim(p_payload->>'purpose'), '') is null
    or jsonb_typeof(p_payload->'items') is distinct from 'array'
    or jsonb_array_length(case when jsonb_typeof(p_payload->'items') = 'array' then p_payload->'items' else '[]'::jsonb end) = 0
    or exists (
      select 1
      from jsonb_array_elements(case when jsonb_typeof(p_payload->'items') = 'array' then p_payload->'items' else '[]'::jsonb end) as entry(item)
      where jsonb_typeof(item) is distinct from 'object'
        or jsonb_typeof(item->'quantity') is distinct from 'number'
        or case when jsonb_typeof(item->'quantity') = 'number' then (item->>'quantity')::numeric <= 0 else true end
        or coalesce(item->>'unit', '') not in ('pcs', 'box', 'pack')
        or nullif(trim(item->>'description'), '') is null
        or (item ? 'estimated_value' and jsonb_typeof(item->'estimated_value') not in ('number', 'null'))
        or case when jsonb_typeof(item->'estimated_value') = 'number' then (item->>'estimated_value')::numeric < 0 else false end
    )
    or nullif(trim(p_payload->>'received_by'), '') is null
    or nullif(trim(p_payload->>'checked_by'), '') is null
  ) then
    raise exception 'Complete the required in-kind donation details.';
  end if;
  if p_kind = 'disbursement' and (
    nullif(trim(p_payload->>'payee'), '') is null
    or nullif(trim(p_payload->>'purpose'), '') is null
    or coalesce(p_payload->>'payment_method', '') not in ('Cash', 'Bank transfer', 'E-wallet', 'Check', 'Other')
    or coalesce(p_payload->>'date_received', '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    or jsonb_typeof(p_payload->'items') is distinct from 'array'
    or jsonb_array_length(case when jsonb_typeof(p_payload->'items') = 'array' then p_payload->'items' else '[]'::jsonb end) = 0
    or exists (
      select 1
      from jsonb_array_elements(case when jsonb_typeof(p_payload->'items') = 'array' then p_payload->'items' else '[]'::jsonb end) as entry(item)
      where jsonb_typeof(item) is distinct from 'object'
        or nullif(trim(item->>'particulars'), '') is null
        or jsonb_typeof(item->'amount') is distinct from 'number'
        or case when jsonb_typeof(item->'amount') = 'number' then (item->>'amount')::numeric <= 0 else true end
    )
    or coalesce((
      select sum(case when jsonb_typeof(item->'amount') = 'number' then (item->>'amount')::numeric else 0 end)
      from jsonb_array_elements(case when jsonb_typeof(p_payload->'items') = 'array' then p_payload->'items' else '[]'::jsonb end) as entry(item)
    ), 0) <> v_amount
    or nullif(trim(p_payload->>'prepared_by'), '') is null
    or nullif(trim(p_payload->>'checked_by'), '') is null
    or nullif(trim(p_payload->>'received_by'), '') is null
  ) then
    raise exception 'Complete the required disbursement details.';
  end if;
  if p_kind = 'expense' and (
    nullif(trim(p_payload->>'expense_category'), '') is null
    or nullif(trim(p_payload->>'supplier'), '') is null
    or nullif(trim(p_payload->>'description'), '') is null
    or coalesce(p_payload->>'date_received', '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    or jsonb_typeof(p_payload->'items') is distinct from 'array'
    or jsonb_array_length(case when jsonb_typeof(p_payload->'items') = 'array' then p_payload->'items' else '[]'::jsonb end) = 0
    or exists (
      select 1
      from jsonb_array_elements(case when jsonb_typeof(p_payload->'items') = 'array' then p_payload->'items' else '[]'::jsonb end) as entry(item)
      where jsonb_typeof(item) is distinct from 'object'
        or coalesce(item->>'date', '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        or nullif(trim(item->>'particulars'), '') is null
        or jsonb_typeof(item->'receipt_number') is distinct from 'string'
        or jsonb_typeof(item->'amount') is distinct from 'number'
        or case when jsonb_typeof(item->'amount') = 'number' then (item->>'amount')::numeric <= 0 else true end
    )
    or coalesce((
      select sum(case when jsonb_typeof(item->'amount') = 'number' then (item->>'amount')::numeric else 0 end)
      from jsonb_array_elements(case when jsonb_typeof(p_payload->'items') = 'array' then p_payload->'items' else '[]'::jsonb end) as entry(item)
    ), 0) <> v_amount
    or nullif(trim(p_payload->>'prepared_by'), '') is null
    or nullif(trim(p_payload->>'checked_by'), '') is null
    or nullif(trim(p_payload->>'received_by'), '') is null
  ) then
    raise exception 'Complete the required expense details.';
  end if;

  if p_kind = 'income' then
    v_source := 'income';
  elsif p_kind = 'cash_donation' then
    v_purpose := nullif(trim(p_payload->>'donation_purpose'), '');
    if v_purpose is null then raise exception 'A donation purpose is required.'; end if;
    v_source := 'donation:' || v_purpose;
    insert into public.donation_categories (name, created_by)
    values (v_purpose, auth.uid()) on conflict (name) do nothing;
  elsif p_kind = 'in_kind_donation' then
    v_amount := 0;
    v_source := null;
  elsif p_kind in ('expense','disbursement','liquidation') or p_kind = 'cash_return' then
    if v_source is null then raise exception 'Select a funding source for this transaction.'; end if;
  end if;
  if p_kind in ('expense','disbursement','cash_return','liquidation') and
    (v_source <> 'income' and (left(v_source, 9) <> 'donation:' or length(v_source) <= 9)) then
    raise exception 'Select a valid income or donation funding source.';
  end if;
  if p_kind in ('expense','disbursement','cash_return','liquidation') and left(v_source, 9) = 'donation:' and
    not exists (
      select 1 from public.donation_categories c
      where c.name = substring(v_source from 10)
      union all
      select 1 from public.transactions t
      where t.kind = 'cash_donation' and t.payload->>'donation_purpose' = substring(v_source from 10)
    ) then
    raise exception 'The selected donation purpose does not exist.';
  end if;

  if p_kind = 'cash_return' and (
    not coalesce(p_payload->>'record_type' in ('Cash return','Reimbursement paid'), false)
    or v_amount <= 0
    or nullif(trim(p_payload->>'person_involved'), '') is null
  ) then
    raise exception 'Complete the required cash return or reimbursement details.';
  end if;
  if p_kind = 'cash_return' and p_payload->>'record_type' = 'Cash return' and (
    jsonb_typeof(p_payload->'total_funds_received') is distinct from 'number'
    or case when jsonb_typeof(p_payload->'total_funds_received') = 'number' then (p_payload->>'total_funds_received')::numeric <= 0 else true end
    or jsonb_typeof(p_payload->'actual_expenses') is distinct from 'number'
    or case when jsonb_typeof(p_payload->'actual_expenses') = 'number' then (p_payload->>'actual_expenses')::numeric < 0 else true end
    or jsonb_typeof(p_payload->'unused_funds_return') is distinct from 'number'
    or case
      when jsonb_typeof(p_payload->'total_funds_received') = 'number'
        and jsonb_typeof(p_payload->'actual_expenses') = 'number'
        and jsonb_typeof(p_payload->'unused_funds_return') = 'number'
      then (p_payload->>'total_funds_received')::numeric <= (p_payload->>'actual_expenses')::numeric
        or v_amount <> (p_payload->>'total_funds_received')::numeric - (p_payload->>'actual_expenses')::numeric
        or v_amount <> (p_payload->>'unused_funds_return')::numeric
      else true
    end
    or coalesce(p_payload->>'returned_through', '') not in ('Cash on Hand','E-wallet','Bank')
    or nullif(trim(p_payload->>'received_by'), '') is null
    or nullif(trim(p_payload->>'checked_by'), '') is null
  ) then
    raise exception 'Complete the required cash return record details.';
  end if;
  if p_kind = 'cash_return' and p_payload->>'record_type' = 'Reimbursement paid' and (
    coalesce(p_payload->>'date_paid', '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    or coalesce(p_payload->>'returned_through', '') not in ('Cash on Hand','E-wallet','Bank')
    or jsonb_typeof(p_payload->'items') is distinct from 'array'
    or jsonb_array_length(case when jsonb_typeof(p_payload->'items') = 'array' then p_payload->'items' else '[]'::jsonb end) = 0
    or exists (
      select 1
      from jsonb_array_elements(case when jsonb_typeof(p_payload->'items') = 'array' then p_payload->'items' else '[]'::jsonb end) as entry(item)
      where jsonb_typeof(item) is distinct from 'object'
        or nullif(trim(item->>'particulars'), '') is null
        or jsonb_typeof(item->'amount') is distinct from 'number'
        or case when jsonb_typeof(item->'amount') = 'number' then (item->>'amount')::numeric <= 0 else true end
    )
    or coalesce((
      select sum(case when jsonb_typeof(item->'amount') = 'number' then (item->>'amount')::numeric else 0 end)
      from jsonb_array_elements(case when jsonb_typeof(p_payload->'items') = 'array' then p_payload->'items' else '[]'::jsonb end) as entry(item)
    ), 0) <> v_amount
    or nullif(trim(p_payload->>'received_by'), '') is null
    or nullif(trim(p_payload->>'checked_by'), '') is null
    or nullif(trim(p_payload->>'requested_by'), '') is null
  ) then
    raise exception 'Complete the required reimbursement details.';
  end if;
  if p_kind = 'cash_donation' and nullif(trim(p_payload->>'donor_name'), '') is null then
    raise exception 'A donor name is required.';
  end if;
  if p_kind = 'cash_donation' and (
    nullif(trim(p_payload->>'payment_method'), '') is null
    or nullif(trim(p_payload->>'received_by'), '') is null
    or nullif(trim(p_payload->>'checked_by'), '') is null
  ) then
    raise exception 'Complete the required donation receipt fields.';
  end if;
  if p_kind = 'liquidation' and (
    nullif(trim(p_payload->>'related_disbursement'), '') is null
    or nullif(trim(p_payload->>'accountable_person'), '') is null
    or coalesce((p_payload->>'cash_released')::numeric, -1) < 0
    or coalesce((p_payload->>'actual_expenses')::numeric, -1) < 0
    or coalesce((p_payload->>'cash_returned')::numeric, -1) < 0
  ) then
    raise exception 'Complete the required liquidation details.';
  end if;
  if p_kind = 'liquidation' then
    v_amount := 0;
  end if;
  if p_kind in ('expense','disbursement') or (p_kind = 'cash_return' and p_payload->>'record_type' = 'Reimbursement paid') then
    -- Serialize fund checks so concurrent releases/outflows cannot exceed the recorded balance.
    perform pg_advisory_xact_lock(hashtext(v_source));
    select coalesce(sum(
      case
        when t.kind in ('income','cash_donation') then t.amount
        when t.kind = 'cash_return' and t.payload->>'record_type' is distinct from 'Reimbursement paid' then t.amount
        when t.kind = 'expense' or (t.kind = 'cash_return' and t.payload->>'record_type' = 'Reimbursement paid') then -t.amount
        else 0
      end
    ), 0)
    into v_balance
    from public.transactions t
    where (t.kind = 'income' and v_source = 'income')
       or (t.kind = 'cash_donation' and coalesce(t.funding_source, 'donation:' || (t.payload->>'donation_purpose')) = v_source)
       or (t.kind in ('expense','cash_return') and t.funding_source = v_source);

    if v_amount > v_balance then
      if v_role not in ('admin','finance_officer','approver') or nullif(trim(p_payload->>'approved_by'), '') is null then
        raise exception 'This amount exceeds the available fund balance (%). A Finance Officer or administrator must provide approval.', v_balance;
      end if;
    end if;
  end if;

  v_prefix := case p_kind
    when 'cash_donation' then 'CDR'
    when 'in_kind_donation' then 'IDR'
    when 'income' then 'IR'
    when 'disbursement' then 'DV'
    when 'expense' then 'ER'
    when 'cash_return' then case when p_payload->>'record_type' = 'Reimbursement paid' then 'RB' else 'CR' end
    when 'liquidation' then 'LR'
  end;
  v_year := extract(year from p_transaction_date)::integer;
  insert into public.document_counters(prefix, document_year, last_value)
  values (v_prefix, v_year, 1)
  on conflict (prefix, document_year) do update
    set last_value = public.document_counters.last_value + 1
  returning last_value into v_sequence;

  insert into public.transactions (kind, document_no, transaction_date, amount, funding_source, payload, created_by)
  values (
    p_kind,
    v_prefix || '-' || v_year::text || '-' || lpad(v_sequence::text, 3, '0'),
    p_transaction_date,
    v_amount,
    v_source,
    p_payload,
    auth.uid()
  )
  returning * into v_tx;
  return to_jsonb(v_tx);
end;
$$;

create or replace function public.rename_donation_category(
  p_old_name text,
  p_new_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_old_name text := trim(p_old_name);
  v_new_name text := trim(p_new_name);
begin
  v_role := public.current_finance_role();
  if auth.uid() is null or coalesce(v_role, '') <> 'admin' then
    raise exception 'Only an administrator can edit donation categories.';
  end if;
  if v_old_name is null or length(v_old_name) = 0 or v_new_name is null or length(v_new_name) not between 1 and 80 then
    raise exception 'Enter a category name between 1 and 80 characters.';
  end if;
  if not exists (select 1 from public.donation_categories where name = v_old_name) then
    raise exception 'The donation category no longer exists.';
  end if;
  if exists (select 1 from public.donation_categories where lower(name) = lower(v_new_name) and name <> v_old_name) then
    raise exception 'A donation category with that name already exists.';
  end if;
  if v_old_name = v_new_name then return; end if;

  update public.donation_categories
  set name = v_new_name
  where name = v_old_name;

  update public.transactions
  set funding_source = 'donation:' || v_new_name,
      payload = case
        when kind = 'cash_donation' and payload->>'donation_purpose' = v_old_name
          then jsonb_set(payload, '{donation_purpose}', to_jsonb(v_new_name), true)
        else payload
      end
  where funding_source = 'donation:' || v_old_name
     or (kind = 'cash_donation' and payload->>'donation_purpose' = v_old_name)
     or (kind = 'in_kind_donation' and payload->>'category' = v_old_name);
end;
$$;

create or replace function public.rename_income_category(
  p_old_name text,
  p_new_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_old_name text := trim(p_old_name);
  v_new_name text := trim(p_new_name);
begin
  v_role := public.current_finance_role();
  if auth.uid() is null or coalesce(v_role, '') <> 'admin' then
    raise exception 'Only an administrator can edit income categories.';
  end if;
  if v_old_name is null or length(v_old_name) = 0 or v_new_name is null or length(v_new_name) not between 1 and 80 then
    raise exception 'Enter a category name between 1 and 80 characters.';
  end if;
  if not exists (select 1 from public.income_categories where name = v_old_name) then
    raise exception 'The income category no longer exists.';
  end if;
  if exists (select 1 from public.income_categories where lower(name) = lower(v_new_name) and name <> v_old_name) then
    raise exception 'An income category with that name already exists.';
  end if;
  if v_old_name = v_new_name then return; end if;

  update public.income_categories
  set name = v_new_name
  where name = v_old_name;

  update public.transactions
  set payload = jsonb_set(payload, '{category}', to_jsonb(v_new_name), true)
  where kind = 'income' and payload->>'category' = v_old_name;
end;
$$;

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.donation_categories enable row level security;
alter table public.income_categories enable row level security;
alter table public.portal_settings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.document_counters enable row level security;

drop policy if exists "profiles_read_authorized" on public.profiles;
create policy "profiles_read_authorized" on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_finance_admin());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
for update to authenticated
using (public.is_finance_admin())
with check (public.is_finance_admin());

drop policy if exists "transactions_read_authorized" on public.transactions;
create policy "transactions_read_authorized" on public.transactions
for select to authenticated
using (public.current_finance_role() in ('admin','staff','audit','finance_officer','treasurer','approver','viewer'));

drop policy if exists "categories_read_authorized" on public.donation_categories;
create policy "categories_read_authorized" on public.donation_categories
for select to authenticated
using (public.current_finance_role() in ('admin','staff','audit','finance_officer','treasurer','approver','viewer'));

drop policy if exists "categories_insert_finance" on public.donation_categories;
create policy "categories_insert_finance" on public.donation_categories
for insert to authenticated
with check (public.current_finance_role() in ('admin','staff','finance_officer','treasurer','approver') and created_by = auth.uid());

drop policy if exists "categories_delete_admin" on public.donation_categories;
create policy "categories_delete_admin" on public.donation_categories
for delete to authenticated
using (
  public.is_finance_admin()
  and not exists (
    select 1 from public.transactions t
    where t.kind = 'cash_donation'
      and (t.payload->>'donation_purpose' = donation_categories.name or t.funding_source = 'donation:' || donation_categories.name)
  )
);

drop policy if exists "income_categories_read_authorized" on public.income_categories;
create policy "income_categories_read_authorized" on public.income_categories
for select to authenticated
using (public.current_finance_role() in ('admin','staff','audit','finance_officer','treasurer','approver','viewer'));

drop policy if exists "income_categories_insert_admin" on public.income_categories;
create policy "income_categories_insert_admin" on public.income_categories
for insert to authenticated
with check (public.is_finance_admin() and created_by = auth.uid());

drop policy if exists "income_categories_delete_admin" on public.income_categories;
create policy "income_categories_delete_admin" on public.income_categories
for delete to authenticated
using (
  public.is_finance_admin()
  and not exists (
    select 1 from public.transactions t
    where t.kind = 'income'
      and t.payload->>'category' = income_categories.name
  )
);

drop policy if exists "portal_settings_read_authorized" on public.portal_settings;
create policy "portal_settings_read_authorized" on public.portal_settings
for select to authenticated
using (public.current_finance_role() in ('admin','staff','audit','finance_officer','treasurer','approver','viewer'));

drop policy if exists "portal_settings_insert_admin" on public.portal_settings;
create policy "portal_settings_insert_admin" on public.portal_settings
for insert to authenticated
with check (public.is_finance_admin() and updated_by = auth.uid());

drop policy if exists "portal_settings_update_admin" on public.portal_settings;
create policy "portal_settings_update_admin" on public.portal_settings
for update to authenticated
using (public.is_finance_admin())
with check (public.is_finance_admin() and updated_by = auth.uid());

drop policy if exists "audit_read_admin" on public.audit_logs;
drop policy if exists "audit_read_admin_audit" on public.audit_logs;
create policy "audit_read_admin_audit" on public.audit_logs
for select to authenticated
using (public.current_finance_role() in ('admin','audit'));

revoke all on public.document_counters from anon, authenticated;
revoke insert, update, delete on public.transactions from anon, authenticated;
grant select on public.profiles, public.transactions, public.donation_categories, public.income_categories, public.portal_settings to authenticated;
grant update on public.profiles to authenticated;
grant insert, delete on public.donation_categories to authenticated;
grant insert, delete on public.income_categories to authenticated;
grant insert, update on public.portal_settings to authenticated;
grant select on public.audit_logs to authenticated;
grant execute on function public.create_transaction(text,date,numeric,text,jsonb) to authenticated;
grant execute on function public.rename_donation_category(text,text) to authenticated;
grant execute on function public.rename_income_category(text,text) to authenticated;
grant execute on function public.current_finance_role() to authenticated;

-- Private receipt bucket. Uploads are restricted to the uploader's folder;
-- finance-role users can review attachments. A path starts with uploader ID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('finance-receipts', 'finance-receipts', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

drop policy if exists "receipt_upload_own_folder" on storage.objects;
create policy "receipt_upload_own_folder" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'finance-receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.current_finance_role() in ('admin','staff','finance_officer','treasurer','approver')
);

drop policy if exists "receipt_read_own_or_admin" on storage.objects;
drop policy if exists "receipt_read_finance_roles" on storage.objects;
create policy "receipt_read_finance_roles" on storage.objects
for select to authenticated
using (
  bucket_id = 'finance-receipts'
  and public.current_finance_role() in ('admin','staff','audit','finance_officer','treasurer','approver')
);

-- Enable realtime updates for records, categories, and role changes.
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='transactions') then
    alter publication supabase_realtime add table public.transactions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='donation_categories') then
    alter publication supabase_realtime add table public.donation_categories;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='income_categories') then
    alter publication supabase_realtime add table public.income_categories;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='portal_settings') then
    alter publication supabase_realtime add table public.portal_settings;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
end
$$;
