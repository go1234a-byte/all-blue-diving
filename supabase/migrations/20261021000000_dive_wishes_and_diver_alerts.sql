-- ALL BLUE — "이 바다 가고 싶어요" + 새 투어·빈자리 알림
--
-- 1) dive_wishes      : 다이버가 다이빙 포인트 가이드에서 "가고 싶어요"를 누른 기록(희망 월 포함)
-- 2) tour_seat_alerts : 정원이 찬 투어에 "빈자리 나면 알려주세요"를 누른 기록
-- 3) diver_alerts     : 다이버 인앱 알림함. 클라이언트는 INSERT 불가 — 아래 트리거만 쓴다.
-- 4) get_dive_wish_demand() : 지역·월별 관심 인원 집계(개인 식별 정보 없음) — 강사 수요 확인·공개 카운트용
--
-- 트리거는 모두 예외를 삼키도록(EXCEPTION WHEN OTHERS → WARNING) 작성했다. 알림 생성이 실패해도
-- 투어 등록·예약 취소 같은 본 동작은 절대 막지 않는다.
-- 되돌리기: 20261021000000_dive_wishes_and_diver_alerts_rollback.sql (migrations 폴더 밖, 수동 실행용)

create table if not exists public.dive_wishes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  point_id text not null,
  region text not null,
  country text not null,
  months smallint[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (profile_id, point_id),
  constraint dive_wishes_months_valid check (months <@ array[1,2,3,4,5,6,7,8,9,10,11,12]::smallint[])
);
create index if not exists dive_wishes_country_idx on public.dive_wishes (country);

create table if not exists public.tour_seat_alerts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  tour_id uuid not null references public.tours(id) on delete cascade,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (profile_id, tour_id)
);
create index if not exists tour_seat_alerts_tour_idx on public.tour_seat_alerts (tour_id) where notified_at is null;

create table if not exists public.diver_alerts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('new_tour', 'seat_open')),
  tour_id uuid references public.tours(id) on delete cascade,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists diver_alerts_once_idx on public.diver_alerts (profile_id, tour_id, type) where type = 'new_tour';
create index if not exists diver_alerts_profile_idx on public.diver_alerts (profile_id, created_at desc);

alter table public.dive_wishes enable row level security;
alter table public.tour_seat_alerts enable row level security;
alter table public.diver_alerts enable row level security;

drop policy if exists dive_wishes_own on public.dive_wishes;
create policy dive_wishes_own on public.dive_wishes
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

drop policy if exists tour_seat_alerts_own on public.tour_seat_alerts;
create policy tour_seat_alerts_own on public.tour_seat_alerts
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

drop policy if exists diver_alerts_select_own on public.diver_alerts;
create policy diver_alerts_select_own on public.diver_alerts
  for select using (auth.uid() = profile_id);
drop policy if exists diver_alerts_update_own on public.diver_alerts;
create policy diver_alerts_update_own on public.diver_alerts
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
drop policy if exists diver_alerts_delete_own on public.diver_alerts;
create policy diver_alerts_delete_own on public.diver_alerts
  for delete using (auth.uid() = profile_id);

-- 알림 내용(제목·본문·투어)은 다이버가 고칠 수 없게: UPDATE는 read 컬럼만 허용
revoke insert, update on public.diver_alerts from anon, authenticated;
grant update (read) on public.diver_alerts to authenticated;
revoke all on public.dive_wishes, public.tour_seat_alerts from anon;

-- ── 새 투어가 열리면: 같은 나라를 "가고 싶어요" 한 다이버에게 알림 ──────────────
create or replace function public.notify_dive_wishers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    if new.status = 'open'
       and new.admin_status is null
       and new.start_date >= current_date
       and (tg_op = 'INSERT' or old.status is distinct from 'open' or old.admin_status is not null) then
      insert into public.diver_alerts (profile_id, type, tour_id, title, body)
      select distinct w.profile_id,
             'new_tour',
             new.id,
             new.country || '에 새 투어가 열렸어요',
             new.title || ' · ' || to_char(new.start_date, 'YYYY.MM.DD') || ' 출발'
      from public.dive_wishes w
      where btrim(w.country) = btrim(new.country)
        and (cardinality(w.months) = 0 or extract(month from new.start_date)::smallint = any (w.months))
      on conflict do nothing;
    end if;
  exception when others then
    raise warning 'notify_dive_wishers failed: %', sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists notify_dive_wishers_trg on public.tours;
create trigger notify_dive_wishers_trg
  after insert or update of status, admin_status on public.tours
  for each row execute function public.notify_dive_wishers();

-- ── 확정 예약이 취소되면: 그 투어에 빈자리 알림을 건 다이버에게 1회 알림 ─────────
create or replace function public.notify_seat_watchers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.tours%rowtype;
begin
  begin
    if old.status = 'confirmed' and (tg_op = 'DELETE' or new.status is distinct from 'confirmed') then
      select * into t from public.tours where id = old.tour_id;
      if found and t.status = 'open' and t.admin_status is null and t.cancelled_at is null
         and t.start_date >= current_date then
        with targets as (
          update public.tour_seat_alerts a
             set notified_at = now()
           where a.tour_id = t.id
             and a.notified_at is null
             and a.profile_id::text is distinct from old.diver_id
          returning a.profile_id
        )
        insert into public.diver_alerts (profile_id, type, tour_id, title, body)
        select profile_id, 'seat_open', t.id,
               '빈자리가 났어요',
               t.title || ' — 먼저 예약하는 분께 자리가 돌아가요'
        from targets;
      end if;
    end if;
  exception when others then
    raise warning 'notify_seat_watchers failed: %', sqlerrm;
  end;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists notify_seat_watchers_trg on public.bookings;
create trigger notify_seat_watchers_trg
  after update of status or delete on public.bookings
  for each row execute function public.notify_seat_watchers();

-- ── 관심 집계(개인 식별 정보 없이 숫자만) ─────────────────────────────────────
create or replace function public.get_dive_wish_demand()
returns table (point_id text, country text, month smallint, wish_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select w.point_id, w.country, m.month, count(distinct w.profile_id)
  from public.dive_wishes w
  left join lateral unnest(case when cardinality(w.months) = 0 then array[0::smallint] else w.months end) as m(month) on true
  group by w.point_id, w.country, m.month;
$$;
revoke all on function public.get_dive_wish_demand() from public;
grant execute on function public.get_dive_wish_demand() to anon, authenticated;

revoke all on function public.notify_dive_wishers() from public, anon, authenticated;
revoke all on function public.notify_seat_watchers() from public, anon, authenticated;

alter publication supabase_realtime add table public.diver_alerts;
