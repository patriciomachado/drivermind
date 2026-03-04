-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- USERS are managed by Supabase Auth, so we reference auth.users

-- WORK_DAYS Table
create table public.work_days (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  date date not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text not null check (status in ('open', 'closed')) default 'open',
  km_total numeric default 0,
  currency_base text default 'BRL', -- Metadata, not strict separation
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Prevent multiple open days or multiple days on same date?
  -- User requested: "1 dia por data por usuário"
  unique(user_id, date)
);

-- EARNINGS Table
create table public.earnings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  work_day_id uuid references public.work_days(id) on delete cascade not null,
  platform text not null check (platform in ('Uber', '99', 'InDrive', 'Por fora')),
  amount numeric not null,
  currency text not null check (currency in ('BRL', 'USD')),
  created_at timestamptz default now()
);

-- EXPENSES Table
create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  work_day_id uuid references public.work_days(id) on delete cascade not null,
  category text not null check (category in ('alimentacao', 'abastecimento', 'manutencao', 'outros')),
  amount numeric not null,
  currency text not null check (currency in ('BRL', 'USD')),
  note text,
  created_at timestamptz default now()
);

-- RLS POLICIES
alter table public.work_days enable row level security;
alter table public.earnings enable row level security;
alter table public.expenses enable row level security;

-- work_days policies
create policy "Users can view their own work days"
  on public.work_days for select
  using (auth.uid() = user_id);

create policy "Users can insert their own work days"
  on public.work_days for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own work days"
  on public.work_days for update
  using (auth.uid() = user_id);

create policy "Users can delete their own work days"
  on public.work_days for delete
  using (auth.uid() = user_id);

-- earnings policies
create policy "Users can view their own earnings"
  on public.earnings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own earnings"
  on public.earnings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own earnings"
  on public.earnings for update
  using (auth.uid() = user_id);

create policy "Users can delete their own earnings"
  on public.earnings for delete
  using (auth.uid() = user_id);

-- expenses policies
create policy "Users can view their own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own expenses"
  on public.expenses for update
  using (auth.uid() = user_id);

create policy "Users can delete their own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- INDEXES
create index idx_work_days_user_date on public.work_days(user_id, date);
create index idx_earnings_work_day_id on public.earnings(work_day_id);
create index idx_expenses_work_day_id on public.expenses(work_day_id);
create index idx_work_days_status on public.work_days(user_id, status); -- To quickly find 'open' day

-- Handle updated_at automatically
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_work_days_updated_at
before update on public.work_days
for each row
execute procedure update_updated_at_column();
