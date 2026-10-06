-- 투어앱 알림·준비물 체크리스트 테이블 (추가만. 기존 객체 변경·삭제 없음)
-- 미적용·미검증 상태로 작성됨.

alter table public.tours add column if not exists checklist_items jsonb not null default '[]'::jsonb;

-- 다이버 알림 (트리거와 서버만 기록, 클라이언트 쓰기 정책 없음)
create table public.tour_diver_notifications (
  id uuid primary key default gen_random_uuid(),
  diver_id text not null,
  tour_id uuid not null references public.tours(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  url text,
  dedupe_key text unique,
  push_sent_at timestamptz,
  push_claimed_at timestamptz,
  push_attempts int not null default 0,
  push_error text,
  created_at timestamptz not null default now()
);
create index tour_diver_notifications_unsent_idx
  on public.tour_diver_notifications (created_at) where push_sent_at is null;
alter table public.tour_diver_notifications enable row level security;
create policy tour_diver_notifications_select_own on public.tour_diver_notifications
  for select using (diver_id = auth.uid()::text);

-- 행이 없으면 알림 ON으로 간주한다 (기존 유저 행을 일괄 만들지 않음)
create table public.tour_notification_settings (
  diver_id text primary key,
  push_enabled boolean not null,
  updated_at timestamptz not null default now()
);
alter table public.tour_notification_settings enable row level security;
create policy tour_notification_settings_own on public.tour_notification_settings
  for all using (diver_id = auth.uid()::text) with check (diver_id = auth.uid()::text);

-- 지역/월 새 투어 알림 구독. months·activity_types 빈 배열 = 상관없음
create table public.tour_alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null,
  country text not null check (length(trim(country)) > 0),
  months int[] not null default '{}'::int[] check (months <@ array[1,2,3,4,5,6,7,8,9,10,11,12]::int[]),
  activity_types text[] not null default '{}'::text[] check (activity_types <@ array['scuba','freediving','liveaboard']::text[]),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.tour_alert_subscriptions enable row level security;
create policy tour_alert_subscriptions_own on public.tour_alert_subscriptions
  for all using (profile_id = auth.uid()::text) with check (profile_id = auth.uid()::text);

-- 유저당 구독 최대 10개 (AFTER 트리거에서 예외 발생 → 해당 INSERT 전체 롤백)
create or replace function public.tour_alert_subscriptions_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.profile_id));
  if (select count(*) from public.tour_alert_subscriptions where profile_id = new.profile_id) > 10 then
    raise exception '새 투어 알림 구독은 최대 10개까지 만들 수 있어요' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger tour_alert_subscriptions_cap
after insert on public.tour_alert_subscriptions
for each row
execute function public.tour_alert_subscriptions_cap();

-- 준비물 진행률: 다이버 본인만 읽고 쓴다. 강사 열람 정책은 만들지 않는다.
create table public.tour_checklist_state (
  diver_id text not null,
  tour_id uuid not null references public.tours(id) on delete cascade,
  item_key text not null,
  checked boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (diver_id, tour_id, item_key)
);
alter table public.tour_checklist_state enable row level security;
create policy tour_checklist_state_own on public.tour_checklist_state
  for all using (diver_id = auth.uid()::text) with check (diver_id = auth.uid()::text);
