-- 투어앱 알림 트리거 (AFTER ... FOR EACH ROW, 행 내용 수정 없음, 실패해도 원래 쓰기는 성공)

create or replace function public.tour_alerts_on_tour_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tour_diver_notifications (diver_id, tour_id, kind, title, body, url)
  select b.diver_id, new.id, 'tour_changed', '투어 정보가 변경됐어요',
         new.title || ' 일정·조건을 확인해 주세요', '/chat/' || new.id::text
  from public.bookings b
  where b.tour_id = new.id and b.status = 'confirmed';
  return new;
exception when others then
  raise warning 'tour_alerts_on_tour_change 실패: %', sqlerrm;
  return new;
end;
$$;

create trigger tour_alerts_on_tours
after update on public.tours
for each row
when (
  old.base_price is distinct from new.base_price
  or old.max_participants is distinct from new.max_participants
  or old.manual_participant_count is distinct from new.manual_participant_count
  or old.status is distinct from new.status
  or old.cancelled_at is distinct from new.cancelled_at
  or old.admin_status is distinct from new.admin_status
)
execute function public.tour_alerts_on_tour_change();

create or replace function public.tour_alerts_on_booking_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tour_diver_notifications (diver_id, tour_id, kind, title, body, url)
  values (
    new.diver_id, new.tour_id, 'booking_changed',
    case when new.status = 'cancelled' then '예약이 취소됐어요' else '예약 인원이 변경됐어요' end,
    '예약 내용을 확인해 주세요', '/chat/' || new.tour_id::text
  );
  return new;
exception when others then
  raise warning 'tour_alerts_on_booking_change 실패: %', sqlerrm;
  return new;
end;
$$;

create trigger tour_alerts_on_bookings
after update on public.bookings
for each row
when (
  old.status is distinct from new.status
  or old.participant_count is distinct from new.participant_count
)
execute function public.tour_alerts_on_booking_change();

-- 새 투어 공개 알림: 검색 노출 조건을 만족하는 INSERT에서만 실행 (UPDATE 공개는 대상 아님)
create or replace function public.tour_alerts_on_new_tour()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tour_diver_notifications (diver_id, tour_id, kind, title, body, url, dedupe_key)
  select s.profile_id, new.id, 'new_tour', '새 투어가 열렸어요', new.title,
         '/tour/' || new.id::text, 'new_tour:' || new.id::text || ':' || s.profile_id
  from public.tour_alert_subscriptions s
  where s.enabled
    and s.country = new.country
    and (cardinality(s.months) = 0 or extract(month from new.start_date)::int = any(s.months))
    and (cardinality(s.activity_types) = 0 or s.activity_types && new.activity_types)
    and s.profile_id <> new.instructor_id
    and not exists (select 1 from public.instructors i where i.id = new.instructor_id and i.profile_id = s.profile_id)
    and not exists (select 1 from public.tour_notification_settings n where n.diver_id = s.profile_id and n.push_enabled = false)
  on conflict (dedupe_key) do nothing;
  return new;
exception when others then
  raise warning 'tour_alerts_on_new_tour 실패: %', sqlerrm;
  return new;
end;
$$;

create trigger tour_alerts_on_tours_insert
after insert on public.tours
for each row
when (new.cancelled_at is null and new.admin_status is null and new.status = 'open')
execute function public.tour_alerts_on_new_tour();
