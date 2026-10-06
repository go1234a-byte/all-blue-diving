create table public.tour_dive_plans (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  dive_no integer not null check (dive_no > 0),
  planned_date date,
  planned_depth_m numeric check (planned_depth_m >= 0),
  planned_bottom_min integer check (planned_bottom_min >= 0),
  gas text,
  dive_type text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (tour_id, dive_no)
);

alter table public.tour_dive_plans enable row level security;

create policy "tour_dive_plans_select_participant_owner_admin" on public.tour_dive_plans
  for select using (
    owns_tour(tour_id)
    or is_admin()
    or exists (
      select 1 from public.bookings b
      where b.tour_id = tour_dive_plans.tour_id and b.diver_id = auth.uid()::text
    )
  );

create policy "tour_dive_plans_write_owner_admin" on public.tour_dive_plans
  for all using (owns_tour(tour_id) or is_admin())
  with check (owns_tour(tour_id) or is_admin());

create table public.tour_change_log (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  field text not null,
  old_value text,
  new_value text,
  changed_at timestamptz not null default now()
);

create index tour_change_log_tour_idx on public.tour_change_log (tour_id, changed_at desc);

alter table public.tour_change_log enable row level security;

create policy "tour_change_log_select_participant_owner_admin" on public.tour_change_log
  for select using (
    owns_tour(tour_id)
    or is_admin()
    or exists (
      select 1 from public.bookings b
      where b.tour_id = tour_change_log.tour_id and b.diver_id = auth.uid()::text
    )
  );

create or replace function public.log_tour_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.start_date is distinct from old.start_date then
    insert into public.tour_change_log (tour_id, field, old_value, new_value)
    values (new.id, 'start_date', old.start_date::text, new.start_date::text);
  end if;
  if new.end_date is distinct from old.end_date then
    insert into public.tour_change_log (tour_id, field, old_value, new_value)
    values (new.id, 'end_date', old.end_date::text, new.end_date::text);
  end if;
  if new.meeting_point is distinct from old.meeting_point then
    insert into public.tour_change_log (tour_id, field, old_value, new_value)
    values (new.id, 'meeting_point', old.meeting_point, new.meeting_point);
  end if;
  if new.status is distinct from old.status then
    insert into public.tour_change_log (tour_id, field, old_value, new_value)
    values (new.id, 'status', old.status, new.status);
  end if;
  return new;
end;
$$;

create trigger tours_change_log
  after update on public.tours
  for each row execute function public.log_tour_change();
