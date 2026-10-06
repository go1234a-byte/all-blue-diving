create table public.devices (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  model text,
  created_at timestamptz not null default now(),
  last_sync_at timestamptz
);

alter table public.devices enable row level security;

create policy "devices_select_own" on public.devices
  for select using (auth.uid() = user_id);

create policy "devices_insert_own" on public.devices
  for insert with check (auth.uid() = user_id);

create policy "devices_update_own" on public.devices
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.dive_logs (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  started_at timestamptz not null,
  duration_sec integer not null,
  max_depth_m numeric not null,
  avg_depth_m numeric not null,
  water_temp_c numeric,
  gas_name text,
  algorithm text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index dive_logs_user_started_idx on public.dive_logs (user_id, started_at desc);

alter table public.dive_logs enable row level security;

create policy "dive_logs_select_own" on public.dive_logs
  for select using (auth.uid() = user_id);

create policy "dive_logs_insert_own" on public.dive_logs
  for insert with check (
    auth.uid() = user_id
    and (
      booking_id is null
      or exists (
        select 1 from public.bookings b
        where b.id = dive_logs.booking_id and b.diver_id = auth.uid()::text
      )
    )
  );
