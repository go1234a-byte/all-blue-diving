create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('tour', 'instructor')),
  target_id text not null,
  created_at timestamptz not null default now(),
  unique (profile_id, target_type, target_id)
);

alter table public.favorites enable row level security;

create policy "favorites_select_own" on public.favorites
  for select using (auth.uid() = profile_id);

create policy "favorites_insert_own" on public.favorites
  for insert with check (auth.uid() = profile_id);

create policy "favorites_delete_own" on public.favorites
  for delete using (auth.uid() = profile_id);
