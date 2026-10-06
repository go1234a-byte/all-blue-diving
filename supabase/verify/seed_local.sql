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

insert into public.tours (id, instructor_id, title, country, site, certification_level, main_image_url,
  start_date, end_date, recruitment_deadline, base_price, status)
values (
  '33333333-3333-3333-3333-333333333333', 'seed-instructor-1', 'SEED 투어', 'SEED-COUNTRY', 'SEED-SITE',
  'open', 'https://example.test/seed.jpg',
  current_date + 30, current_date + 33, current_date + 10, 100000, 'open'
)
on conflict (id) do nothing;

insert into public.bookings (tour_id, diver_id, diver_name, base_price, payment_method, gender, status)
values ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'SEED 다이버 A', 100000, 'card', 'male', 'confirmed');
