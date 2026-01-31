-- NEW TABLE: Vehicles
create table if not exists public.vehicles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  model text,
  plate text,
  active boolean default false,
  created_at timestamptz default now()
);

-- DATA SECURITY FOR VEHICLES
alter table public.vehicles enable row level security;

create policy "Users can view their own vehicles" on public.vehicles for select using (auth.uid() = user_id);
create policy "Users can insert their own vehicles" on public.vehicles for insert with check (auth.uid() = user_id);
create policy "Users can update their own vehicles" on public.vehicles for update using (auth.uid() = user_id);
create policy "Users can delete their own vehicles" on public.vehicles for delete using (auth.uid() = user_id);

-- UPDATE WORK_DAYS from old schema to support DriverFlow
alter table public.work_days add column if not exists vehicle_id uuid references public.vehicles(id);
alter table public.work_days add column if not exists km_start numeric;
alter table public.work_days add column if not exists km_end numeric;
