-- 로컬 검증 전용 가짜 시드. 운영·원격 DB에 적용하지 않는다 (supabase start 후 로컬에서만 실행).
-- 모든 값은 가짜이며 실제 사용자·투어와 무관하다.

insert into auth.users (id, aud, role, email)
values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'seed-diver-a@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'seed-diver-b@example.test')
on conflict (id) do nothing;

insert into public.profiles (id, name)
values
  ('11111111-1111-1111-1111-111111111111', 'SEED 다이버 A'),
  ('22222222-2222-2222-2222-222222222222', 'SEED 다이버 B')
on conflict (id) do nothing;

insert into public.instructors (id, name)
values ('seed-instructor-1', 'SEED 강사')
on conflict (id) do nothing;

-- S14·S21(찜 다이버 2명 필요), S20(강사 본인 제외)용 추가 가짜 계정
insert into auth.users (id, aud, role, email)
values
  ('55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'seed-diver-c@example.test'),
  ('66666666-6666-6666-6666-666666666666', 'authenticated', 'authenticated', 'seed-instructor-user@example.test')
on conflict (id) do nothing;

insert into public.profiles (id, name)
values
  ('55555555-5555-5555-5555-555555555555', 'SEED 다이버 C'),
  ('66666666-6666-6666-6666-666666666666', 'SEED 강사 계정')
on conflict (id) do nothing;

update public.instructors set profile_id = '66666666-6666-6666-6666-666666666666'
where id = 'seed-instructor-1' and profile_id is distinct from '66666666-6666-6666-6666-666666666666';

-- 생성 쿼터 트리거(enforce_tour_creation_quota)는 on conflict보다 먼저 실행되므로, 이미 있으면 아예 넣지 않는다.
insert into public.tours (id, instructor_id, title, country, site, certification_level, main_image_url,
  start_date, end_date, recruitment_deadline, base_price, status)
select * from (values (
  '33333333-3333-3333-3333-333333333333'::uuid, 'seed-instructor-1', 'SEED 투어', 'SEED-COUNTRY', 'SEED-SITE',
  'open', 'https://example.test/seed.jpg',
  current_date + 30, current_date + 33, current_date + 10, 100000, 'open'
)) as v(id, instructor_id, title, country, site, certification_level, main_image_url, start_date, end_date, recruitment_deadline, base_price, status)
where not exists (select 1 from public.tours t where t.id = v.id);

-- 가격은 validate_booking_price 트리거 계산식과 맞춘다: 옵션 0, 수수료 10%(10,000), 할인 0, 총액 110,000
-- 정원 트리거는 중복 검사 전에 돈다. 이미 있으면 넣지 않는다.
insert into public.bookings (tour_id, diver_id, diver_name, base_price, options_cost, platform_fee, discount_amount, total_paid, payment_method, gender, status)
select v.* from (values ('33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111', 'SEED 다이버 A', 100000::numeric, 0::numeric, 10000::numeric, 0::numeric, 110000::numeric, 'card', 'male', 'confirmed')) as v(tour_id, diver_id, diver_name, base_price, options_cost, platform_fee, discount_amount, total_paid, payment_method, gender, status)
where not exists (select 1 from public.bookings b where b.tour_id = v.tour_id and b.diver_id = v.diver_id);
