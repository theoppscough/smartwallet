-- SmartWallet PostgreSQL schema for Supabase
-- Run this file in the Supabase SQL Editor after creating a project.

create extension if not exists "pgcrypto";

create type public.app_role as enum ('user', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'user',
  monthly_budget numeric(12, 2) not null default 0 check (monthly_budget >= 0),
  created_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  issuer text not null,
  card_name text not null,
  annual_fee numeric(10, 2) not null default 0 check (annual_fee >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (issuer, card_name)
);

create table public.reward_rules (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  category text not null check (
    category in (
      'Dining',
      'Grocery',
      'Gas',
      'Travel',
      'Online Shopping',
      'Entertainment',
      'Other'
    )
  ),
  reward_rate numeric(5, 2) not null check (reward_rate >= 0 and reward_rate <= 100),
  start_date date,
  end_date date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.user_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  nickname text,
  created_at timestamptz not null default now(),
  unique (user_id, card_id)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  merchant text not null,
  category text not null check (
    category in (
      'Dining',
      'Grocery',
      'Gas',
      'Travel',
      'Online Shopping',
      'Entertainment',
      'Other'
    )
  ),
  expense_date date not null default current_date,
  card_id uuid references public.cards(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  month_start date not null,
  amount numeric(12, 2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, month_start),
  check (month_start = date_trunc('month', month_start)::date)
);

create table public.ads (
  id uuid primary key default gen_random_uuid(),
  issuer text not null,
  headline text not null,
  target_category text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.cards enable row level security;
alter table public.reward_rules enable row level security;
alter table public.user_cards enable row level security;
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;
alter table public.ads enable row level security;

create policy "Users can read own profile"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "Users can update own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Authenticated users can read active cards"
on public.cards for select
to authenticated
using (active or public.is_admin());

create policy "Admins manage cards"
on public.cards for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Authenticated users can read active reward rules"
on public.reward_rules for select
to authenticated
using (active or public.is_admin());

create policy "Admins manage reward rules"
on public.reward_rules for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Users manage own wallet"
on public.user_cards for all
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy "Users manage own expenses"
on public.expenses for all
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy "Users manage own budgets"
on public.budgets for all
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy "Authenticated users can read active ads"
on public.ads for select
to authenticated
using (active or public.is_admin());

create policy "Admins manage ads"
on public.ads for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace view public.admin_category_report
with (security_invoker = true) as
select
  category,
  count(*) as transaction_count,
  sum(amount) as total_spending,
  avg(amount) as average_transaction
from public.expenses
group by category;

create or replace view public.admin_card_usage_report
with (security_invoker = true) as
select
  c.id as card_id,
  c.issuer,
  c.card_name,
  count(e.id) as transaction_count,
  coalesce(sum(e.amount), 0) as total_spending
from public.cards c
left join public.expenses e on e.card_id = c.id
group by c.id, c.issuer, c.card_name;

insert into public.cards (issuer, card_name, annual_fee) values
  ('American Express', 'Amex Gold', 325),
  ('Chase', 'Freedom Flex', 0),
  ('Citi', 'Double Cash', 0),
  ('Capital One', 'Savor', 0)
on conflict do nothing;

insert into public.reward_rules (card_id, category, reward_rate)
select id, 'Dining', 4 from public.cards where card_name = 'Amex Gold'
union all
select id, 'Grocery', 4 from public.cards where card_name = 'Amex Gold'
union all
select id, 'Other', 1 from public.cards where card_name = 'Amex Gold'
union all
select id, 'Grocery', 5 from public.cards where card_name = 'Freedom Flex'
union all
select id, 'Gas', 3 from public.cards where card_name = 'Freedom Flex'
union all
select id, 'Other', 1 from public.cards where card_name = 'Freedom Flex'
union all
select id, 'Other', 2 from public.cards where card_name = 'Double Cash'
union all
select id, 'Dining', 3 from public.cards where card_name = 'Savor'
union all
select id, 'Entertainment', 3 from public.cards where card_name = 'Savor'
union all
select id, 'Other', 1 from public.cards where card_name = 'Savor';
