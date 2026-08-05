-- ALL BLUE 다이빙 플랫폼 — 롤백: 보안 강화 3단계(bookings/payouts 조회 잠금) 되돌리기
--
-- fix_bookings_payouts_select_lockdown.sql 적용 후 예약 목록/채팅방/정산 내역 화면이
-- 깨지면, 이 파일을 Supabase SQL Editor에서 실행해 즉시 이전 상태(전체 공개 조회)로
-- 되돌릴 수 있습니다.
--
-- 주의: bookings_directory/payouts_directory 뷰와 헬퍼 함수(is_booking_staff,
-- is_booking_companion)는 그대로 둬도 무해합니다. 코드 패치까지 되돌리려면 별도로
-- 안내드린 코드 롤백 절차를 따라주세요.

drop policy if exists "bookings_select_own_or_tour_owner_or_admin" on public.bookings;
create policy "bookings_public_select" on public.bookings
  for select using (true);

drop policy if exists "payouts_select_own_instructor_or_admin" on public.payouts;
create policy "payouts_public_select" on public.payouts
  for select using (true);
