-- 검증 시나리오. 전부 하나의 트랜잭션에서 실행하고 마지막에 ROLLBACK (데이터 남지 않음).
-- 적용 전이 아니라 적용 후(운영 DB 또는 스테이징)에서 돌린다. 실패 시 EXCEPTION으로 중단된다.
begin;

create temp table _t on commit drop as
select t.id as tour_id, b.diver_id
from public.tours t
join public.bookings b on b.tour_id = t.id and b.status = 'confirmed'
limit 1;

-- 공통 준비: 찜 다이버 1명을 고른다 (예약자·강사 제외는 S20에서 따로 본다)
create temp table _fav on commit drop as
select p.id as profile_id
from public.profiles p, _t
where not exists (select 1 from public.bookings b where b.tour_id = _t.tour_id and b.diver_id = p.id::text)
limit 1;

-- S1) 한 번의 가격 인하가 변경이력(tours_change_log)과 찜 가격 인하 알림을 함께 만든다
do $$
declare n_notif_before int; n_notif_after int; n_log_before int; n_log_after int; p0 numeric; tid uuid;
begin
  if not exists (select 1 from _t) or not exists (select 1 from _fav) then raise notice 'S1 SKIP'; return; end if;
  tid := (select tour_id from _t);
  update public.tours set status = 'open', cancelled_at = null, admin_status = null where id = tid;
  insert into public.favorites (profile_id, target_type, target_id) select profile_id, 'tour', tid::text from _fav on conflict do nothing;
  select base_price into p0 from public.tours where id = tid;
  select count(*) into n_notif_before from public.tour_diver_notifications where kind = 'price_drop';
  select count(*) into n_log_before from public.tour_change_log;
  update public.tours set base_price = p0 - 100 where id = tid;
  select count(*) into n_notif_after from public.tour_diver_notifications where kind = 'price_drop';
  select count(*) into n_log_after from public.tour_change_log;
  if n_notif_after <= n_notif_before then raise exception 'S1 실패: 찜 가격 인하 알림 미생성'; end if;
  if n_log_after <= n_log_before then raise exception 'S1 실패: tour_change_log 미생성(트리거 동시 실행 문제)'; end if;
  raise notice 'S1 OK: 가격 인하 알림 +%, 변경이력 +%', n_notif_after - n_notif_before, n_log_after - n_log_before;
end $$;

-- S2) 알림 실패가 원래 쓰기를 막지 않음: 알림 테이블에 항상 실패하는 제약을 임시로 걸고, 가격 인하(알림 발생 경로)를 수행
alter table public.tour_diver_notifications add constraint tmp_s2_block check (false) not valid;
do $$
declare before_price numeric; after_price numeric; tid uuid;
begin
  if not exists (select 1 from _t) then raise notice 'S2 SKIP'; return; end if;
  tid := (select tour_id from _t);
  select base_price into before_price from public.tours where id = tid;
  update public.tours set base_price = before_price - 100 where id = tid;
  select base_price into after_price from public.tours where id = tid;
  if after_price <> before_price - 100 then raise exception 'S2 실패: 알림 실패 때문에 투어 수정이 막힘'; end if;
  raise notice 'S2 OK: 알림 실패에도 투어 수정 성공';
end $$;
alter table public.tour_diver_notifications drop constraint tmp_s2_block;

-- S3) WHEN 조건: 찜 알림과 무관한 컬럼 변경(제목)은 알림을 만들지 않음 (투어 정보 변경 알림은 범위 밖이라 어떤 변경으로도 생기지 않음)
do $$
declare n_before int; n_after int;
begin
  if not exists (select 1 from _t) then raise notice 'S3 SKIP'; return; end if;
  select count(*) into n_before from public.tour_diver_notifications;
  update public.tours set title = title where id = (select tour_id from _t);
  select count(*) into n_after from public.tour_diver_notifications;
  if n_after <> n_before then raise exception 'S3 실패: 무관한 변경에 알림 생성'; end if;
  raise notice 'S3 OK: 무관한 변경은 알림 없음';
end $$;

-- S4) 찜한 다이버에게 seat_opened: 만석 투어에서 확정 예약을 취소하면 잔여석 0→1 → 찜 다이버 1건
do $$
declare fav uuid; tid uuid; n_before int; n_after int;
begin
  if not exists (select 1 from _t) then raise notice 'S4 SKIP'; return; end if;
  tid := (select tour_id from _t);
  select p.id into fav from public.profiles p
    where not exists (select 1 from public.bookings b where b.tour_id = tid and b.diver_id = p.id::text)
    limit 1;
  if fav is null then raise notice 'S4 SKIP: 찜 대상 프로필 없음'; return; end if;
  update public.tours set status = 'open', cancelled_at = null, admin_status = null, manual_participant_count = 0,
    max_participants = public.tour_alerts_confirmed_count(tid) where id = tid;
  insert into public.favorites (profile_id, target_type, target_id) values (fav, 'tour', tid::text) on conflict do nothing;
  select count(*) into n_before from public.tour_diver_notifications where kind = 'seat_opened' and diver_id = fav::text;
  update public.bookings set status = 'cancelled'
    where tour_id = tid and diver_id = (select diver_id from _t limit 1) and status = 'confirmed';
  select count(*) into n_after from public.tour_diver_notifications where kind = 'seat_opened' and diver_id = fav::text;
  if n_after - n_before <> 1 then raise exception 'S4 실패: 찜 다이버 seat_opened %건 (기대 1)', n_after - n_before; end if;
  raise notice 'S4 OK';
end $$;

-- S5) RLS: 다이버는 자기 알림만 보이고, 직접 insert는 막힘
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', (select diver_id from _t limit 1), 'role', 'authenticated')::text, true);
do $$
declare others int; begin
  select count(*) into others from public.tour_diver_notifications where diver_id <> auth.uid()::text;
  if others > 0 then raise exception 'S5 실패: 다른 다이버 알림이 보임(%건)', others; end if;
  raise notice 'S5a OK: 타인 알림 0건';
end $$;
do $$ begin
  insert into public.tour_diver_notifications (diver_id, tour_id, kind, title, body)
  values ('x', (select tour_id from _t), 'test', 't', 'b');
  raise exception 'S5 실패: 클라이언트 insert가 허용됨';
exception when insufficient_privilege or others then
  if sqlerrm like 'S5 실패%' then raise; end if;
  raise notice 'S5b OK: 클라이언트 insert 차단 (%)', sqlerrm;
end $$;
reset role;

-- S6) 준비물 진행률: 다른 다이버 행이 안 보임
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'nobody-test-id', 'role', 'authenticated')::text, true);
do $$
declare n int; begin
  select count(*) into n from public.tour_checklist_state;
  if n > 0 then raise exception 'S6 실패: 타인 준비물 진행률이 보임'; end if;
  raise notice 'S6 OK';
end $$;
reset role;


-- S7) 구독 매칭: 같은 지역 구독자에게 새 투어 알림 1건 (복제한 공개 투어 INSERT)
do $$
declare src_country text; n_before int; n_after int; new_id uuid;
begin
  if not exists (select 1 from _t) then raise notice 'S7 SKIP'; return; end if;
  select t.country into src_country from public.tours t where t.id = (select tour_id from _t);
  insert into public.tour_alert_subscriptions (profile_id, country) values ('test-sub-match', src_country);
  select count(*) into n_before from public.tour_diver_notifications where diver_id = 'test-sub-match';
  insert into public.tours
    select (jsonb_populate_record(null::public.tours,
      (to_jsonb(t) - 'id') || jsonb_build_object('id', gen_random_uuid(), 'status', 'open', 'cancelled_at', null, 'admin_status', null))).*
  from public.tours t where t.id = (select tour_id from _t) returning id into new_id;
  select count(*) into n_after from public.tour_diver_notifications where diver_id = 'test-sub-match' and kind = 'new_tour';
  if n_after - n_before <> 1 then raise exception 'S7 실패: 구독 매칭 알림 %건 (기대 1건)', n_after - n_before; end if;
  raise notice 'S7 OK';
end $$;

-- S8) 조건 불일치 미발송: 다른 지역 구독자와 월 조건이 안 맞는 구독자는 알림 없음
do $$
declare n_before int; n_after int; src_country text; src_month int;
begin
  if not exists (select 1 from _t) then raise notice 'S8 SKIP'; return; end if;
  select t.country, extract(month from t.start_date)::int into src_country, src_month
    from public.tours t where t.id = (select tour_id from _t);
  insert into public.tour_alert_subscriptions (profile_id, country) values ('test-sub-other-country', 'ZZ-NO-MATCH');
  insert into public.tour_alert_subscriptions (profile_id, country, months)
    values ('test-sub-wrong-month', src_country, array[ (case when src_month = 1 then 2 else 1 end) ]::int[]);
  select count(*) into n_before from public.tour_diver_notifications where kind = 'new_tour';
  insert into public.tours
    select (jsonb_populate_record(null::public.tours,
      (to_jsonb(t) - 'id') || jsonb_build_object('id', gen_random_uuid(), 'status', 'open', 'cancelled_at', null, 'admin_status', null))).*
  from public.tours t where t.id = (select tour_id from _t);
  select count(*) into n_after from public.tour_diver_notifications where kind = 'new_tour';
  if n_after - n_before <> 1 then raise exception 'S8 실패: 신규 알림 %건 (기대: 월 조건 안 맞는 구독자 제외 후 매칭 1건만)', n_after - n_before; end if;
  if exists (select 1 from public.tour_diver_notifications where diver_id in ('test-sub-other-country', 'test-sub-wrong-month') and kind = 'new_tour') then
    raise exception 'S8 실패: 조건 불일치 구독자에게 발송됨';
  end if;
  raise notice 'S8 OK';
end $$;

-- S9) 구독 11번째 거부
do $$
declare i int;
begin
  for i in 1..10 loop
    insert into public.tour_alert_subscriptions (profile_id, country) values ('test-sub-cap', 'CAP' || i);
  end loop;
  begin
    insert into public.tour_alert_subscriptions (profile_id, country) values ('test-sub-cap', 'CAP11');
    raise exception 'S9 실패: 11번째 구독이 허용됨';
  exception when sqlstate 'P0001' then
    raise notice 'S9 OK: 11번째 구독 거부';
  end;
end $$;


-- S10) 찜한 투어 D-7 알림: 찜한 다이버(기예약 아님)에게 1건, 중복 실행 시 추가 없음
do $$
declare fav_profile uuid; n1 int; n2 int; n3 int;
begin
  if not exists (select 1 from _t) then raise notice 'S10 SKIP'; return; end if;
  select p.id into fav_profile from public.profiles p
    where not exists (select 1 from public.bookings b where b.tour_id = (select tour_id from _t) and b.diver_id = p.id::text)
    limit 1;
  if fav_profile is null then raise notice 'S10 SKIP: 찜 대상 프로필 없음'; return; end if;
  update public.tours set status = 'open', cancelled_at = null, admin_status = null,
    recruitment_deadline = current_date + 7 where id = (select tour_id from _t);
  insert into public.favorites (profile_id, target_type, target_id) values (fav_profile, 'tour', (select tour_id from _t)::text);
  select count(*) into n1 from public.tour_diver_notifications where kind = 'deadline_d7';
  perform public.tour_generate_daily_alerts();
  select count(*) into n2 from public.tour_diver_notifications where kind = 'deadline_d7';
  perform public.tour_generate_daily_alerts();
  select count(*) into n3 from public.tour_diver_notifications where kind = 'deadline_d7';
  if n2 - n1 <> 1 then raise exception 'S10 실패: D-7 알림 %건 (기대 1)', n2 - n1; end if;
  if n3 <> n2 then raise exception 'S10 실패: 재실행 시 중복 생성'; end if;
  raise notice 'S10 OK';
end $$;

-- S11) 기예약자와 취소 투어는 제외
do $$
declare booked_fav uuid; n_before int; n_after int;
begin
  if not exists (select 1 from _t) then raise notice 'S11 SKIP'; return; end if;
  begin booked_fav := (select diver_id from _t limit 1)::uuid; exception when others then raise notice 'S11 SKIP: 예약자 id가 uuid 아님'; return; end;
  if not exists (select 1 from public.profiles where id = booked_fav) then raise notice 'S11 SKIP: 예약자 프로필 없음'; return; end if;
  update public.tours set status = 'open', cancelled_at = null, admin_status = null,
    recruitment_deadline = current_date + 1 where id = (select tour_id from _t);
  insert into public.favorites (profile_id, target_type, target_id) values (booked_fav, 'tour', (select tour_id from _t)::text)
    on conflict do nothing;
  select count(*) into n_before from public.tour_diver_notifications where kind = 'deadline_d1' and diver_id = booked_fav::text;
  perform public.tour_generate_daily_alerts();
  select count(*) into n_after from public.tour_diver_notifications where kind = 'deadline_d1' and diver_id = booked_fav::text;
  if n_after <> n_before then raise exception 'S11 실패: 기예약자에게 마감 알림 발송'; end if;
  update public.tours set cancelled_at = now() where id = (select tour_id from _t);
  raise notice 'S11 OK (취소 투어 제외는 아래 S12에서 같은 함수로 확인)';
end $$;

-- S12) 취소 투어는 D-1이어도 알림 없음 (cancelled_at 설정 상태에서 재실행)
do $$
declare n_before int; n_after int;
begin
  if not exists (select 1 from _t) then raise notice 'S12 SKIP'; return; end if;
  update public.tours set cancelled_at = now(), recruitment_deadline = current_date + 1
    where id = (select tour_id from _t);
  select count(*) into n_before from public.tour_diver_notifications where kind = 'deadline_d1';
  perform public.tour_generate_daily_alerts();
  select count(*) into n_after from public.tour_diver_notifications where kind = 'deadline_d1';
  if n_after <> n_before then raise exception 'S12 실패: 취소 투어에 마감 알림 발송'; end if;
  raise notice 'S12 OK';
end $$;

-- S14) 종류별 끄기 — 찜 마감: favorite_alerts_enabled=false 인 다이버는 D-7 알림이 안 생김 (다른 설정 행 없는 찜 다이버는 생김)
do $$
declare off_profile uuid; on_profile uuid; n_off int; n_on int;
begin
  if not exists (select 1 from _t) then raise notice 'S14 SKIP'; return; end if;
  select p.id into off_profile from public.profiles p
    where not exists (select 1 from public.bookings b where b.tour_id = (select tour_id from _t) and b.diver_id = p.id::text)
    limit 1;
  select p.id into on_profile from public.profiles p
    where p.id <> off_profile
      and not exists (select 1 from public.bookings b where b.tour_id = (select tour_id from _t) and b.diver_id = p.id::text)
    limit 1;
  if off_profile is null or on_profile is null then raise notice 'S14 SKIP: 찜 대상 프로필 2명 필요'; return; end if;
  update public.tours set status = 'open', cancelled_at = null, admin_status = null,
    recruitment_deadline = current_date + 7 where id = (select tour_id from _t);
  insert into public.tour_notification_settings (diver_id, favorite_alerts_enabled) values (off_profile::text, false);
  insert into public.favorites (profile_id, target_type, target_id) values (off_profile, 'tour', (select tour_id from _t)::text)
    on conflict do nothing;
  insert into public.favorites (profile_id, target_type, target_id) values (on_profile, 'tour', (select tour_id from _t)::text)
    on conflict do nothing;
  perform public.tour_generate_daily_alerts();
  select count(*) into n_off from public.tour_diver_notifications where kind = 'deadline_d7' and diver_id = off_profile::text;
  select count(*) into n_on from public.tour_diver_notifications where kind = 'deadline_d7' and diver_id = on_profile::text;
  if n_off <> 0 then raise exception 'S14 실패: 찜 알림 끈 다이버에게 마감 알림 %건', n_off; end if;
  if n_on < 1 then raise exception 'S14 실패: 설정 행 없는 다이버(기본 ON)에게 알림 없음'; end if;
  raise notice 'S14 OK';
end $$;

-- S15) 종류별 끄기 — 구독: subscription_alerts_enabled=false 인 다이버는 조건 맞아도 새 투어 알림이 안 생김
do $$
declare src_country text; n_before int; n_after int;
begin
  if not exists (select 1 from _t) then raise notice 'S15 SKIP'; return; end if;
  select t.country into src_country from public.tours t where t.id = (select tour_id from _t);
  insert into public.tour_notification_settings (diver_id, subscription_alerts_enabled) values ('test-sub-off', false);
  insert into public.tour_alert_subscriptions (profile_id, country) values ('test-sub-off', src_country);
  select count(*) into n_before from public.tour_diver_notifications where diver_id = 'test-sub-off';
  insert into public.tours
    select (jsonb_populate_record(null::public.tours,
      (to_jsonb(t) - 'id') || jsonb_build_object('id', gen_random_uuid(), 'status', 'open', 'cancelled_at', null, 'admin_status', null))).*
  from public.tours t where t.id = (select tour_id from _t);
  select count(*) into n_after from public.tour_diver_notifications where diver_id = 'test-sub-off';
  if n_after <> n_before then raise exception 'S15 실패: 구독 알림 끈 다이버에게 새 투어 알림 발송'; end if;
  raise notice 'S15 OK';
end $$;

-- S16) 스키마: push_enabled 컬럼은 없고, 종류별 3개 컬럼은 기본값 true
do $$
declare n_push int; n_default_true int;
begin
  select count(*) into n_push from information_schema.columns
    where table_schema = 'public' and table_name = 'tour_notification_settings' and column_name = 'push_enabled';
  if n_push <> 0 then raise exception 'S16 실패: push_enabled 컬럼이 남아 있음'; end if;
  select count(*) into n_default_true from information_schema.columns
    where table_schema = 'public' and table_name = 'tour_notification_settings'
      and column_name in ('favorite_alerts_enabled', 'subscription_alerts_enabled', 'checklist_reminders_enabled')
      and is_nullable = 'NO' and column_default = 'true';
  if n_default_true <> 3 then raise exception 'S16 실패: 종류별 설정 컬럼 3개(NOT NULL, 기본값 true) 아님 (%개)', n_default_true; end if;
  raise notice 'S16 OK';
end $$;

-- 공통 준비: 신규 시나리오마다 투어를 모집 중·비취소 상태로 되돌린다 (S11·S12가 취소 상태로 남기므로)

-- S17) price_drop: 인상은 알림 없음, 인하는 찜 다이버 1건, 같은 가격으로 다시 내려도 중복 없음
do $$
declare fav uuid; tid uuid; p0 numeric; n1 int; n2 int; n3 int; n4 int;
begin
  if not exists (select 1 from _t) then raise notice 'S17 SKIP'; return; end if;
  tid := (select tour_id from _t);
  select p.id into fav from public.profiles p
    where not exists (select 1 from public.bookings b where b.tour_id = tid and b.diver_id = p.id::text)
    limit 1;
  if fav is null then raise notice 'S17 SKIP: 찜 대상 프로필 없음'; return; end if;
  update public.tours set status = 'open', cancelled_at = null, admin_status = null where id = tid;
  insert into public.favorites (profile_id, target_type, target_id) values (fav, 'tour', tid::text) on conflict do nothing;
  select base_price into p0 from public.tours where id = tid;
  select count(*) into n1 from public.tour_diver_notifications where kind = 'price_drop' and diver_id = fav::text;
  update public.tours set base_price = p0 + 100 where id = tid;
  select count(*) into n2 from public.tour_diver_notifications where kind = 'price_drop' and diver_id = fav::text;
  if n2 <> n1 then raise exception 'S17 실패: 인상에 가격 인하 알림이 발송됨'; end if;
  update public.tours set base_price = p0 - 100 where id = tid;
  select count(*) into n3 from public.tour_diver_notifications where kind = 'price_drop' and diver_id = fav::text;
  if n3 - n2 <> 1 then raise exception 'S17 실패: 인하 알림 %건 (기대 1)', n3 - n2; end if;
  update public.tours set base_price = p0 + 50 where id = tid;
  update public.tours set base_price = p0 - 100 where id = tid;
  select count(*) into n4 from public.tour_diver_notifications where kind = 'price_drop' and diver_id = fav::text;
  if n4 <> n3 then raise exception 'S17 실패: 같은 가격 재인하에 중복 발송'; end if;
  raise notice 'S17 OK';
end $$;

-- S18) seats_low: 4석→3석 진입 때 찜 다이버 1건, 3석→2석은 추가 없음
do $$
declare fav uuid; tid uuid; conf int; n1 int; n2 int; n3 int;
begin
  if not exists (select 1 from _t) then raise notice 'S18 SKIP'; return; end if;
  tid := (select tour_id from _t);
  select p.id into fav from public.profiles p
    where not exists (select 1 from public.bookings b where b.tour_id = tid and b.diver_id = p.id::text)
    limit 1;
  if fav is null then raise notice 'S18 SKIP: 찜 대상 프로필 없음'; return; end if;
  update public.tours set status = 'open', cancelled_at = null, admin_status = null, manual_participant_count = 0 where id = tid;
  insert into public.favorites (profile_id, target_type, target_id) values (fav, 'tour', tid::text) on conflict do nothing;
  conf := public.tour_alerts_confirmed_count(tid);
  update public.tours set max_participants = conf + 4 where id = tid;
  select count(*) into n1 from public.tour_diver_notifications where kind = 'seats_low' and diver_id = fav::text;
  update public.tours set max_participants = conf + 3 where id = tid;
  select count(*) into n2 from public.tour_diver_notifications where kind = 'seats_low' and diver_id = fav::text;
  if n2 - n1 <> 1 then raise exception 'S18 실패: 4→3석 진입 알림 %건 (기대 1)', n2 - n1; end if;
  update public.tours set max_participants = conf + 2 where id = tid;
  select count(*) into n3 from public.tour_diver_notifications where kind = 'seats_low' and diver_id = fav::text;
  if n3 <> n2 then raise exception 'S18 실패: 3→2석에 추가 알림'; end if;
  raise notice 'S18 OK';
end $$;

-- S19) seat_opened 하루 1회: 만석→취소로 알림이 생긴 뒤, 같은 날 다시 만석→취소해도 같은 투어·다이버 알림은 늘지 않음
do $$
declare fav uuid; tid uuid; bdiver text; n1 int; n2 int;
begin
  if not exists (select 1 from _t) then raise notice 'S19 SKIP'; return; end if;
  tid := (select tour_id from _t);
  bdiver := (select diver_id from _t limit 1);
  select p.id into fav from public.profiles p
    where not exists (select 1 from public.bookings b where b.tour_id = tid and b.diver_id = p.id::text) limit 1;
  if fav is null then raise notice 'S19 SKIP: 찜 대상 프로필 없음'; return; end if;
  update public.bookings set status = 'confirmed' where tour_id = tid and diver_id = bdiver and status = 'cancelled';
  update public.tours set status = 'open', cancelled_at = null, admin_status = null, manual_participant_count = 0,
    max_participants = public.tour_alerts_confirmed_count(tid) where id = tid;
  insert into public.favorites (profile_id, target_type, target_id) values (fav, 'tour', tid::text) on conflict do nothing;
  update public.bookings set status = 'cancelled' where tour_id = tid and diver_id = bdiver and status = 'confirmed';
  select count(*) into n1 from public.tour_diver_notifications where kind = 'seat_opened' and tour_id = tid and diver_id = fav::text;
  if n1 < 1 then raise exception 'S19 실패: 만석→취소에 seat_opened 없음'; end if;
  update public.bookings set status = 'confirmed' where tour_id = tid and diver_id = bdiver and status = 'cancelled';
  update public.bookings set status = 'cancelled' where tour_id = tid and diver_id = bdiver and status = 'confirmed';
  select count(*) into n2 from public.tour_diver_notifications where kind = 'seat_opened' and tour_id = tid and diver_id = fav::text;
  if n2 <> n1 then raise exception 'S19 실패: 같은 날 재발생에 중복 알림 %건', n2 - n1; end if;
  update public.bookings set status = 'confirmed' where tour_id = tid and diver_id = bdiver and status = 'cancelled';
  raise notice 'S19 OK';
end $$;

-- S20) 제외: 그 투어 확정 예약자와 강사 본인에게는 price_drop이 가지 않음
do $$
declare tid uuid; p0 numeric; bdiver text; inst uuid; n_b1 int; n_b2 int; n_i1 int; n_i2 int;
begin
  if not exists (select 1 from _t) then raise notice 'S20 SKIP'; return; end if;
  tid := (select tour_id from _t);
  bdiver := (select diver_id from _t limit 1);
  begin
    inst := (select i.profile_id::uuid from public.instructors i join public.tours t on t.instructor_id = i.id where t.id = tid);
  exception when others then
    raise notice 'S20 SKIP: 강사 profile_id가 uuid 아님'; return;
  end;
  if inst is null or not exists (select 1 from public.profiles where id = inst) then raise notice 'S20 SKIP: 강사 프로필 없음'; return; end if;
  begin
    perform bdiver::uuid;
  exception when others then
    raise notice 'S20 SKIP: 예약자 id가 uuid 아님'; return;
  end;
  update public.tours set status = 'open', cancelled_at = null, admin_status = null where id = tid;
  insert into public.favorites (profile_id, target_type, target_id) values (bdiver::uuid, 'tour', tid::text) on conflict do nothing;
  insert into public.favorites (profile_id, target_type, target_id) values (inst, 'tour', tid::text) on conflict do nothing;
  select base_price into p0 from public.tours where id = tid;
  select count(*) into n_b1 from public.tour_diver_notifications where kind = 'price_drop' and diver_id = bdiver;
  select count(*) into n_i1 from public.tour_diver_notifications where kind = 'price_drop' and diver_id = inst::text;
  update public.tours set base_price = p0 - 100 where id = tid;
  select count(*) into n_b2 from public.tour_diver_notifications where kind = 'price_drop' and diver_id = bdiver;
  select count(*) into n_i2 from public.tour_diver_notifications where kind = 'price_drop' and diver_id = inst::text;
  if n_b2 <> n_b1 then raise exception 'S20 실패: 확정 예약자에게 가격 인하 알림'; end if;
  if n_i2 <> n_i1 then raise exception 'S20 실패: 강사 본인에게 가격 인하 알림'; end if;
  raise notice 'S20 OK';
end $$;

-- S21) 종류별 끄기: favorite_alerts_enabled=false 인 찜 다이버는 가격 인하 알림 제외, 설정 없는 찜 다이버는 받음
do $$
declare off_p uuid; on_p uuid; tid uuid; p0 numeric; n_off int; n_on int;
begin
  if not exists (select 1 from _t) then raise notice 'S21 SKIP'; return; end if;
  tid := (select tour_id from _t);
  select p.id into off_p from public.profiles p
    where not exists (select 1 from public.bookings b where b.tour_id = tid and b.diver_id = p.id::text) limit 1;
  select p.id into on_p from public.profiles p
    where p.id <> off_p and not exists (select 1 from public.bookings b where b.tour_id = tid and b.diver_id = p.id::text)
      and not exists (select 1 from public.tour_notification_settings s where s.diver_id = p.id::text and s.favorite_alerts_enabled = false)
    limit 1;
  if off_p is null or on_p is null then raise notice 'S21 SKIP: 찜 대상 프로필 2명 필요'; return; end if;
  update public.tours set status = 'open', cancelled_at = null, admin_status = null where id = tid;
  insert into public.tour_notification_settings (diver_id, favorite_alerts_enabled) values (off_p::text, false)
    on conflict (diver_id) do update set favorite_alerts_enabled = false;
  insert into public.favorites (profile_id, target_type, target_id) values (off_p, 'tour', tid::text) on conflict do nothing;
  insert into public.favorites (profile_id, target_type, target_id) values (on_p, 'tour', tid::text) on conflict do nothing;
  select base_price into p0 from public.tours where id = tid;
  update public.tours set base_price = p0 - 100 where id = tid;
  select count(*) into n_off from public.tour_diver_notifications where kind = 'price_drop' and diver_id = off_p::text;
  select count(*) into n_on from public.tour_diver_notifications where kind = 'price_drop' and diver_id = on_p::text;
  if n_off <> 0 then raise exception 'S21 실패: 찜 알림 끈 다이버에게 가격 인하 %건', n_off; end if;
  if n_on < 1 then raise exception 'S21 실패: 설정 없는 찜 다이버에게 가격 인하 알림 없음'; end if;
  raise notice 'S21 OK';
end $$;

-- S22) booking_changed: 본인이 직접 취소하면 알림을 만들지 않음 (auth.uid() = 예약자)
do $$
declare bdiver text; tid uuid; n_before int; n_after int;
begin
  if not exists (select 1 from _t) then raise notice 'S22 SKIP'; return; end if;
  tid := (select tour_id from _t);
  bdiver := (select diver_id from _t limit 1);
  begin perform bdiver::uuid; exception when others then raise notice 'S22 SKIP: 예약자 id가 uuid 아님'; return; end;
  update public.bookings set status = 'confirmed' where tour_id = tid and diver_id = bdiver and status = 'cancelled';
  perform set_config('request.jwt.claims', json_build_object('sub', bdiver)::text, true);
  select count(*) into n_before from public.tour_diver_notifications where kind = 'booking_changed' and diver_id = bdiver;
  update public.bookings set status = 'cancelled' where tour_id = tid and diver_id = bdiver and status = 'confirmed';
  select count(*) into n_after from public.tour_diver_notifications where kind = 'booking_changed' and diver_id = bdiver;
  perform set_config('request.jwt.claims', '', true);
  if n_after <> n_before then raise exception 'S22 실패: 본인 취소에 알림 생성 (%건)', n_after - n_before; end if;
  raise notice 'S22 OK';
end $$;

-- S23) booking_changed: 관리자(다른 사용자)가 대신 취소하면 예약자에게 1건
do $$
declare bdiver text; tid uuid; admin_uid uuid; n_before int; n_after int;
begin
  if not exists (select 1 from _t) then raise notice 'S23 SKIP'; return; end if;
  tid := (select tour_id from _t);
  bdiver := (select diver_id from _t limit 1);
  begin perform bdiver::uuid; exception when others then raise notice 'S23 SKIP: 예약자 id가 uuid 아님'; return; end;
  select p.id into admin_uid from public.profiles p where p.id::text <> bdiver limit 1;
  if admin_uid is null then raise notice 'S23 SKIP: 관리자 역할 대행 프로필 없음'; return; end if;
  update public.bookings set status = 'confirmed' where tour_id = tid and diver_id = bdiver and status = 'cancelled';
  perform set_config('request.jwt.claims', json_build_object('sub', admin_uid)::text, true);
  select count(*) into n_before from public.tour_diver_notifications where kind = 'booking_changed' and diver_id = bdiver;
  update public.bookings set status = 'cancelled' where tour_id = tid and diver_id = bdiver and status = 'confirmed';
  select count(*) into n_after from public.tour_diver_notifications where kind = 'booking_changed' and diver_id = bdiver;
  perform set_config('request.jwt.claims', '', true);
  if n_after - n_before <> 1 then raise exception 'S23 실패: 대행 취소 알림 %건 (기대 1)', n_after - n_before; end if;
  update public.bookings set status = 'confirmed' where tour_id = tid and diver_id = bdiver and status = 'cancelled';
  raise notice 'S23 OK';
end $$;

-- 준비물 리마인드 공통: 투어를 모집 중·비취소, 출발일을 원하는 날로 맞추고 기존 준비물 알림을 지운다.

-- S24) 준비물 리마인드 D-7: 상태 행이 없는 확정 예약자에게 1건, 같은 날 재실행해도 중복 없음
do $$
declare tid uuid; bdiver text; n1 int; n2 int; n3 int;
begin
  if not exists (select 1 from _t) then raise notice 'S24 SKIP'; return; end if;
  tid := (select tour_id from _t);
  bdiver := (select diver_id from _t limit 1);
  update public.tours set status = 'open', cancelled_at = null, admin_status = null, start_date = current_date + 7 where id = tid;
  delete from public.tour_checklist_state where diver_id = bdiver and tour_id = tid;
  delete from public.tour_diver_notifications where kind = 'checklist_d7' and tour_id = tid;
  select count(*) into n1 from public.tour_diver_notifications where kind = 'checklist_d7' and diver_id = bdiver;
  perform public.tour_generate_checklist_reminders();
  select count(*) into n2 from public.tour_diver_notifications where kind = 'checklist_d7' and diver_id = bdiver;
  perform public.tour_generate_checklist_reminders();
  select count(*) into n3 from public.tour_diver_notifications where kind = 'checklist_d7' and diver_id = bdiver;
  if n2 - n1 <> 1 then raise exception 'S24 실패: D-7 준비물 알림 %건 (기대 1)', n2 - n1; end if;
  if n3 <> n2 then raise exception 'S24 실패: 같은 날 재실행에 중복 생성'; end if;
  raise notice 'S24 OK';
end $$;

-- S25) 준비물 리마인드 D-1: D-7과 별도로 D-1에도 1건 (출발일을 내일로 바꾼 뒤 실행)
do $$
declare tid uuid; bdiver text; n1 int; n2 int;
begin
  if not exists (select 1 from _t) then raise notice 'S25 SKIP'; return; end if;
  tid := (select tour_id from _t);
  bdiver := (select diver_id from _t limit 1);
  update public.tours set start_date = current_date + 1 where id = tid;
  select count(*) into n1 from public.tour_diver_notifications where kind = 'checklist_d1' and diver_id = bdiver;
  perform public.tour_generate_checklist_reminders();
  select count(*) into n2 from public.tour_diver_notifications where kind = 'checklist_d1' and diver_id = bdiver;
  if n2 - n1 <> 1 then raise exception 'S25 실패: D-1 준비물 알림 %건 (기대 1)', n2 - n1; end if;
  raise notice 'S25 OK';
end $$;

-- S26) 강사 항목이 없어도(checklist_items = []) 미완료자에게는 발송 (기본 템플릿이 항상 있음)
do $$
declare tid uuid; bdiver text; n1 int; n2 int;
begin
  if not exists (select 1 from _t) then raise notice 'S26 SKIP'; return; end if;
  tid := (select tour_id from _t);
  bdiver := (select diver_id from _t limit 1);
  update public.tours set start_date = current_date + 7, checklist_items = '[]'::jsonb where id = tid;
  delete from public.tour_checklist_state where diver_id = bdiver and tour_id = tid;
  delete from public.tour_diver_notifications where kind = 'checklist_d7' and tour_id = tid;
  select count(*) into n1 from public.tour_diver_notifications where kind = 'checklist_d7' and diver_id = bdiver;
  perform public.tour_generate_checklist_reminders();
  select count(*) into n2 from public.tour_diver_notifications where kind = 'checklist_d7' and diver_id = bdiver;
  if n2 - n1 <> 1 then raise exception 'S26 실패: 강사 항목 없는 미완료자에게 발송 안 됨 (%건)', n2 - n1; end if;
  raise notice 'S26 OK';
end $$;

-- S27) 종류별 OFF: checklist_reminders_enabled = false 인 다이버는 제외
do $$
declare tid uuid; bdiver text; n2 int;
begin
  if not exists (select 1 from _t) then raise notice 'S27 SKIP'; return; end if;
  tid := (select tour_id from _t);
  bdiver := (select diver_id from _t limit 1);
  update public.tours set start_date = current_date + 7 where id = tid;
  delete from public.tour_checklist_state where diver_id = bdiver and tour_id = tid;
  delete from public.tour_diver_notifications where kind = 'checklist_d7' and tour_id = tid;
  insert into public.tour_notification_settings (diver_id, checklist_reminders_enabled) values (bdiver, false)
    on conflict (diver_id) do update set checklist_reminders_enabled = false;
  perform public.tour_generate_checklist_reminders();
  select count(*) into n2 from public.tour_diver_notifications where kind = 'checklist_d7' and tour_id = tid and diver_id = bdiver;
  if n2 <> 0 then raise exception 'S27 실패: 준비물 리마인드 끈 다이버에게 발송 (%건)', n2; end if;
  update public.tour_notification_settings set checklist_reminders_enabled = true where diver_id = bdiver;
  raise notice 'S27 OK';
end $$;

-- S28) 취소된 예약은 제외
do $$
declare tid uuid; bdiver text; n2 int;
begin
  if not exists (select 1 from _t) then raise notice 'S28 SKIP'; return; end if;
  tid := (select tour_id from _t);
  bdiver := (select diver_id from _t limit 1);
  update public.tours set start_date = current_date + 7, status = 'open', cancelled_at = null, admin_status = null where id = tid;
  delete from public.tour_checklist_state where diver_id = bdiver and tour_id = tid;
  delete from public.tour_diver_notifications where kind = 'checklist_d7' and tour_id = tid;
  update public.bookings set status = 'cancelled' where tour_id = tid and diver_id = bdiver and status = 'confirmed';
  perform public.tour_generate_checklist_reminders();
  select count(*) into n2 from public.tour_diver_notifications where kind = 'checklist_d7' and tour_id = tid and diver_id = bdiver;
  if n2 <> 0 then raise exception 'S28 실패: 취소된 예약자에게 리마인드 발송'; end if;
  update public.bookings set status = 'confirmed' where tour_id = tid and diver_id = bdiver and status = 'cancelled';
  raise notice 'S28 OK';
end $$;

-- S29) 취소 투어는 제외
do $$
declare tid uuid; bdiver text; n2 int;
begin
  if not exists (select 1 from _t) then raise notice 'S29 SKIP'; return; end if;
  tid := (select tour_id from _t);
  bdiver := (select diver_id from _t limit 1);
  delete from public.tour_checklist_state where diver_id = bdiver and tour_id = tid;
  delete from public.tour_diver_notifications where kind = 'checklist_d7' and tour_id = tid;
  update public.tours set start_date = current_date + 7, cancelled_at = now() where id = tid;
  perform public.tour_generate_checklist_reminders();
  select count(*) into n2 from public.tour_diver_notifications where kind = 'checklist_d7' and tour_id = tid and diver_id = bdiver;
  if n2 <> 0 then raise exception 'S29 실패: 취소 투어에 리마인드 발송'; end if;
  update public.tours set cancelled_at = null where id = tid;
  raise notice 'S29 OK';
end $$;

-- S30) 전부 체크한 다이버는 제외 (checked_count = total_count)
do $$
declare tid uuid; bdiver text; n2 int;
begin
  if not exists (select 1 from _t) then raise notice 'S30 SKIP'; return; end if;
  tid := (select tour_id from _t);
  bdiver := (select diver_id from _t limit 1);
  update public.tours set start_date = current_date + 7, status = 'open', cancelled_at = null, admin_status = null where id = tid;
  delete from public.tour_diver_notifications where kind = 'checklist_d7' and tour_id = tid;
  insert into public.tour_checklist_state (diver_id, tour_id, total_count, checked_count)
    values (bdiver, tid, 3, 3)
    on conflict (diver_id, tour_id) do update set total_count = 3, checked_count = 3;
  perform public.tour_generate_checklist_reminders();
  select count(*) into n2 from public.tour_diver_notifications where kind = 'checklist_d7' and tour_id = tid and diver_id = bdiver;
  if n2 <> 0 then raise exception 'S30 실패: 전부 체크한 다이버에게 리마인드 발송'; end if;
  raise notice 'S30 OK';
end $$;

-- S31) 본문 문구: 상태 행이 있으면 "아직 챙기지 않은 준비물 N개", 상태 행이 없으면 "출발 전 준비물을 확인해 보세요"
do $$
declare tid uuid; bdiver text; body_partial text; body_none text;
begin
  if not exists (select 1 from _t) then raise notice 'S31 SKIP'; return; end if;
  tid := (select tour_id from _t);
  bdiver := (select diver_id from _t limit 1);
  update public.tours set start_date = current_date + 7, status = 'open', cancelled_at = null, admin_status = null where id = tid;
  delete from public.tour_diver_notifications where kind = 'checklist_d7' and tour_id = tid;
  insert into public.tour_checklist_state (diver_id, tour_id, total_count, checked_count)
    values (bdiver, tid, 3, 1)
    on conflict (diver_id, tour_id) do update set total_count = 3, checked_count = 1;
  perform public.tour_generate_checklist_reminders();
  select body into body_partial from public.tour_diver_notifications where kind = 'checklist_d7' and tour_id = tid and diver_id = bdiver;
  if body_partial is distinct from '아직 챙기지 않은 준비물 2개' then raise exception 'S31 실패: 부분 체크 본문 "%"', body_partial; end if;
  delete from public.tour_diver_notifications where kind = 'checklist_d7' and tour_id = tid;
  delete from public.tour_checklist_state where diver_id = bdiver and tour_id = tid;
  perform public.tour_generate_checklist_reminders();
  select body into body_none from public.tour_diver_notifications where kind = 'checklist_d7' and tour_id = tid and diver_id = bdiver;
  if body_none is distinct from '출발 전 준비물을 확인해 보세요' then raise exception 'S31 실패: 상태 행 없음 본문 "%"', body_none; end if;
  raise notice 'S31 OK';
end $$;

-- S32) 강사가 나중에 항목을 추가하면 전부 체크했던 다이버도 리마인드 대상 (강사 항목 미완료 판정)
do $$
declare tid uuid; bdiver text; n1 int; n2 int; v_body text;
begin
  if not exists (select 1 from _t) then raise notice 'S32 SKIP'; return; end if;
  tid := (select tour_id from _t);
  bdiver := (select diver_id from _t limit 1);
  update public.tours set start_date = current_date + 7, status = 'open', cancelled_at = null, admin_status = null,
    checklist_items = '[]'::jsonb where id = tid;
  insert into public.tour_checklist_state (diver_id, tour_id, checked_keys, total_count, checked_count)
    values (bdiver, tid, array['passport','mask'], 2, 2)
    on conflict (diver_id, tour_id) do update set checked_keys = array['passport','mask'], hidden_keys = '{}', total_count = 2, checked_count = 2;
  delete from public.tour_diver_notifications where kind = 'checklist_d7' and tour_id = tid;
  perform public.tour_generate_checklist_reminders();
  select count(*) into n1 from public.tour_diver_notifications where kind = 'checklist_d7' and tour_id = tid and diver_id = bdiver;
  if n1 <> 0 then raise exception 'S32 실패: 전부 체크한 상태에서 알림 발생 (%건)', n1; end if;
  update public.tours set checklist_items = '[{"key":"new-item","label":"새 준비물","required":false}]'::jsonb where id = tid;
  perform public.tour_generate_checklist_reminders();
  select count(*) into n2 from public.tour_diver_notifications where kind = 'checklist_d7' and tour_id = tid and diver_id = bdiver;
  select n.body into v_body from public.tour_diver_notifications n where n.kind = 'checklist_d7' and n.tour_id = tid and n.diver_id = bdiver;
  if n2 <> 1 then raise exception 'S32 실패: 강사 항목 추가 후 리마인드 %건 (기대 1)', n2; end if;
  if v_body is distinct from '강사님이 준비물을 추가했어요. 확인해 보세요' then raise exception 'S32 실패: 본문 "%"', v_body; end if;
  raise notice 'S32 OK';
end $$;

-- S33) 강사 항목을 다이버가 숨긴 경우는 미완료로 보지 않음
do $$
declare tid uuid; bdiver text; n2 int;
begin
  if not exists (select 1 from _t) then raise notice 'S33 SKIP'; return; end if;
  tid := (select tour_id from _t);
  bdiver := (select diver_id from _t limit 1);
  update public.tours set start_date = current_date + 7, status = 'open', cancelled_at = null, admin_status = null,
    checklist_items = '[{"key":"ins-hidden","label":"숨길 강사 항목","required":false}]'::jsonb where id = tid;
  insert into public.tour_checklist_state (diver_id, tour_id, checked_keys, hidden_keys, total_count, checked_count)
    values (bdiver, tid, array['passport'], array['ins-hidden'], 1, 1)
    on conflict (diver_id, tour_id) do update set checked_keys = array['passport'], hidden_keys = array['ins-hidden'], total_count = 1, checked_count = 1;
  delete from public.tour_diver_notifications where kind = 'checklist_d7' and tour_id = tid;
  perform public.tour_generate_checklist_reminders();
  select count(*) into n2 from public.tour_diver_notifications where kind = 'checklist_d7' and tour_id = tid and diver_id = bdiver;
  if n2 <> 0 then raise exception 'S33 실패: 숨긴 강사 항목 때문에 미완료로 판정 (%건)', n2; end if;
  update public.tours set checklist_items = '[]'::jsonb where id = tid;
  raise notice 'S33 OK';
end $$;

-- S13) 권한: anon·authenticated는 생성 함수를 실행할 수 없음
do $$ begin
  if has_function_privilege('anon', 'public.tour_generate_daily_alerts()', 'execute')
     or has_function_privilege('authenticated', 'public.tour_generate_daily_alerts()', 'execute') then
    raise exception 'S13 실패: anon/authenticated 실행 권한 있음';
  end if;
  if not has_function_privilege('service_role', 'public.tour_generate_daily_alerts()', 'execute') then
    raise exception 'S13 실패: service_role 실행 권한 없음';
  end if;
  raise notice 'S13 OK';
end $$;

rollback;
