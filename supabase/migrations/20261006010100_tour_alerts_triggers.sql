-- 투어앱 알림 트리거 (AFTER ... FOR EACH ROW, 행 내용 수정 없음, 실패해도 원래 쓰기는 성공)

-- 잔여석 계산 기준: 확정 예약 인원(participant_count, 없으면 1) 합 + manual_participant_count.
-- public_tour_booking_counts 뷰와 프론트 정원 검증(getConfirmedParticipantCount)과 같은 기준이다.
create or replace function public.tour_alerts_confirmed_count(p_tour_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(coalesce(b.participant_count, 1)), 0)::integer
  from public.bookings b
  where b.tour_id = p_tour_id and b.status = 'confirmed';
$$;

-- 찜한 다이버 중 알림 받을 사람. 제외: 그 투어 확정 예약자, 강사 본인, 종류별 알림 OFF, 취소/정지 투어 전체.
create or replace function public.tour_alerts_favorite_recipients(p_tour_id uuid)
returns table (recipient_id text)
language sql
stable
security definer
set search_path = public
as $$
  select f.profile_id::text
  from public.favorites f
  join public.tours t on t.id = p_tour_id
  where f.target_type = 'tour'
    and f.target_id = p_tour_id::text
    and t.cancelled_at is null
    and t.admin_status is null
    and not exists (
      select 1 from public.bookings b
      where b.tour_id = p_tour_id and b.diver_id = f.profile_id::text and b.status = 'confirmed'
    )
    and not exists (
      select 1 from public.instructors i
      where i.id = t.instructor_id and i.profile_id::text = f.profile_id::text
    )
    and not exists (
      select 1 from public.tour_notification_settings s
      where s.diver_id = f.profile_id::text and s.favorite_alerts_enabled = false
    );
$$;

-- 잔여석이 바뀐 한 번의 쓰기에서 seats_low / seat_opened 판정.
-- dedupe_key에 txid를 넣어, 한 번의 전환(=한 트랜잭션)당 한 번만 기록하고, 다음 전환은 새로 알린다.
create or replace function public.tour_alerts_apply_seat_events(
  p_tour_id uuid, p_title text, p_before_left integer, p_after_left integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 잔여석이 3석 초과 → 1~3석으로 처음 내려갈 때 1회 (0석은 마감 배지로 표현하므로 제외)
  if p_before_left > 3 and p_after_left between 1 and 3 then
    insert into public.tour_diver_notifications (diver_id, tour_id, kind, title, body, url, dedupe_key)
    select r.recipient_id, p_tour_id, 'seats_low',
           '마감 임박: 남은 자리 ' || p_after_left || '석',
           p_title || ' 자리가 얼마 남지 않았어요',
           '/tour/' || p_tour_id::text,
           'seats_low:' || p_tour_id::text || ':' || r.recipient_id || ':' || txid_current()::text
    from public.tour_alerts_favorite_recipients(p_tour_id) as r
    on conflict (dedupe_key) do nothing;
  end if;

  -- 잔여석 0 → 1석 이상: 자리 재발생. 같은 투어·같은 다이버는 KST 하루 1회만 알린다.
  if p_before_left <= 0 and p_after_left >= 1 then
    insert into public.tour_diver_notifications (diver_id, tour_id, kind, title, body, url, dedupe_key)
    select r.recipient_id, p_tour_id, 'seat_opened',
           '자리가 다시 났어요',
           p_title || ' 자리가 ' || p_after_left || '석 생겼어요',
           '/tour/' || p_tour_id::text,
           'seat_opened:' || p_tour_id::text || ':' || r.recipient_id || ':' || to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM-DD')
    from public.tour_alerts_favorite_recipients(p_tour_id) as r
    on conflict (dedupe_key) do nothing;
  end if;
end;
$$;

create or replace function public.tour_alerts_on_booking_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 본인이 직접 취소·변경한 경우는 알리지 않는다 (본인이 이미 화면에서 확인함).
  -- 관리자·강사가 대신 한 변경(auth.uid()가 다름) 또는 서비스 역할(auth.uid() null)만 알린다.
  if auth.uid() is not null and auth.uid()::text = new.diver_id then
    return new;
  end if;
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
    and not exists (select 1 from public.tour_notification_settings n where n.diver_id = s.profile_id and n.subscription_alerts_enabled = false)
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

-- 찜 가격 인하: base_price가 내려갈 때만. 같은 가격을 다시 내리면 dedupe_key가 같아 중복 발송되지 않는다.
create or replace function public.tour_alerts_on_price_drop()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tour_diver_notifications (diver_id, tour_id, kind, title, body, url, dedupe_key)
  select r.recipient_id, new.id, 'price_drop',
         '찜한 투어 가격이 내려갔어요',
         new.title || ' ' || to_char(old.base_price::numeric, 'FM999,999,999') || '원 → ' || to_char(new.base_price::numeric, 'FM999,999,999') || '원',
         '/tour/' || new.id::text,
         'price_drop:' || new.id::text || ':' || r.recipient_id || ':' || new.base_price::text
  from public.tour_alerts_favorite_recipients(new.id) as r
  on conflict (dedupe_key) do nothing;
  return new;
exception when others then
  raise warning 'tour_alerts_on_price_drop 실패: %', sqlerrm;
  return new;
end;
$$;

create trigger tour_alerts_price_drop
after update on public.tours
for each row
when (new.base_price < old.base_price)
execute function public.tour_alerts_on_price_drop();

-- 정원(max_participants)·수동 인원 변경으로 잔여석이 바뀐 경우
create or replace function public.tour_alerts_on_tour_seats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  confirmed_now integer;
begin
  confirmed_now := public.tour_alerts_confirmed_count(new.id);
  perform public.tour_alerts_apply_seat_events(
    new.id, new.title,
    old.max_participants - (confirmed_now + coalesce(old.manual_participant_count, 0)),
    new.max_participants - (confirmed_now + coalesce(new.manual_participant_count, 0))
  );
  return new;
exception when others then
  raise warning 'tour_alerts_on_tour_seats 실패: %', sqlerrm;
  return new;
end;
$$;

create trigger tour_alerts_seats_on_tours
after update on public.tours
for each row
when (
  old.max_participants is distinct from new.max_participants
  or old.manual_participant_count is distinct from new.manual_participant_count
)
execute function public.tour_alerts_on_tour_seats();

-- 예약 쓰기로 잔여석이 바뀐 경우 (INSERT는 확정 상태로 바로 들어오는 경로가 있다, UPDATE는 취소·인원 변경)
create or replace function public.tour_alerts_on_booking_seats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t_title text;
  t_max integer;
  t_manual integer;
  old_contrib integer := 0;
  new_contrib integer := 0;
  confirmed_now integer;
  confirmed_before integer;
begin
  select t.title, t.max_participants, coalesce(t.manual_participant_count, 0)
    into t_title, t_max, t_manual
  from public.tours t where t.id = new.tour_id;
  if not found then return new; end if;

  if tg_op = 'UPDATE' then
    if old.status = 'confirmed' then
      old_contrib := coalesce(old.participant_count, 1);
    end if;
  end if;
  if new.status = 'confirmed' then
    new_contrib := coalesce(new.participant_count, 1);
  end if;

  confirmed_now := public.tour_alerts_confirmed_count(new.tour_id);
  confirmed_before := confirmed_now - new_contrib + old_contrib;

  perform public.tour_alerts_apply_seat_events(
    new.tour_id, t_title,
    t_max - (confirmed_before + t_manual),
    t_max - (confirmed_now + t_manual)
  );
  return new;
exception when others then
  raise warning 'tour_alerts_on_booking_seats 실패: %', sqlerrm;
  return new;
end;
$$;

create trigger tour_alerts_seats_on_booking_insert
after insert on public.bookings
for each row
when (new.status = 'confirmed')
execute function public.tour_alerts_on_booking_seats();

create trigger tour_alerts_seats_on_booking_update
after update on public.bookings
for each row
when (
  old.status is distinct from new.status
  or old.participant_count is distinct from new.participant_count
)
execute function public.tour_alerts_on_booking_seats();
