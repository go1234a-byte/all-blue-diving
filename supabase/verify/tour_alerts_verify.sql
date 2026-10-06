-- 검증 시나리오. 전부 하나의 트랜잭션에서 실행하고 마지막에 ROLLBACK (데이터 남지 않음).
-- 적용 전이 아니라 적용 후(운영 DB 또는 스테이징)에서 돌린다. 실패 시 EXCEPTION으로 중단된다.
begin;

create temp table _t on commit drop as
select t.id as tour_id, b.diver_id
from public.tours t
join public.bookings b on b.tour_id = t.id and b.status = 'confirmed'
limit 1;

-- S1) 두 트리거 동시 실행: base_price 변경 한 번으로 알림과 변경이력이 모두 생겨야 함
do $$
declare n_notif_before int; n_notif_after int; n_log_before int; n_log_after int;
begin
  if not exists (select 1 from _t) then raise notice 'S1 SKIP: 확정 예약 투어 없음'; return; end if;
  select count(*) into n_notif_before from public.tour_diver_notifications;
  select count(*) into n_log_before from public.tour_change_log;
  update public.tours set base_price = base_price + 1 where id = (select tour_id from _t);
  select count(*) into n_notif_after from public.tour_diver_notifications;
  select count(*) into n_log_after from public.tour_change_log;
  if n_notif_after <= n_notif_before then raise exception 'S1 실패: 알림 미생성'; end if;
  if n_log_after <= n_log_before then raise exception 'S1 실패: tour_change_log 미생성(두 트리거 동시 실행 문제)'; end if;
  raise notice 'S1 OK: 알림 +%, 변경이력 +%', n_notif_after - n_notif_before, n_log_after - n_log_before;
end $$;

-- S2) 알림 실패가 원래 쓰기를 막지 않음: 알림 테이블에 항상 실패하는 제약을 임시로 건다
alter table public.tour_diver_notifications add constraint tmp_s2_block check (false) not valid;
do $$
declare before_price numeric; after_price numeric;
begin
  if not exists (select 1 from _t) then raise notice 'S2 SKIP'; return; end if;
  select base_price into before_price from public.tours where id = (select tour_id from _t);
  update public.tours set base_price = base_price + 1 where id = (select tour_id from _t);
  select base_price into after_price from public.tours where id = (select tour_id from _t);
  if after_price <> before_price + 1 then raise exception 'S2 실패: 알림 실패 때문에 투어 수정이 막힘'; end if;
  raise notice 'S2 OK: 알림 실패에도 투어 수정 성공';
end $$;
alter table public.tour_diver_notifications drop constraint tmp_s2_block;

-- S3) WHEN 조건: 알림 필드와 무관한 컬럼 변경은 알림을 만들지 않음
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

-- S4) 예약 상태 변경 → 해당 다이버에게 알림 1건 이상
do $$
declare n_before int; n_after int;
begin
  if not exists (select 1 from _t) then raise notice 'S4 SKIP'; return; end if;
  select count(*) into n_before from public.tour_diver_notifications;
  update public.bookings set status = 'cancelled'
    where tour_id = (select tour_id from _t) and diver_id = (select diver_id from _t limit 1);
  select count(*) into n_after from public.tour_diver_notifications;
  if n_after <= n_before then raise exception 'S4 실패: 예약 취소 알림 미생성'; end if;
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

rollback;
