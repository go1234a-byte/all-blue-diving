-- ALL BLUE 다이빙 플랫폼 — 보안 강화 3단계: bookings/payouts 조회(select) 잠금
--
-- 문제: bookings 테이블의 select 정책이 지금 `using (true)` — 로그인 여부와 무관하게
--   누구나 Supabase REST API를 직접 호출하면 전체 예약의 여권 정보, 항공편 정보,
--   결제 금액(기본요금/옵션비용/플랫폼수수료/결제총액/현장잔금), 쿠폰코드/할인액,
--   취소사유·환불액·증빙파일명, 동반자 명단까지 전부 그대로 조회할 수 있는 상태입니다.
--   화면에서는 "본인과 담당 강사만 확인할 수 있습니다"라고 안내하고 있지만(항공/여권
--   정보 탭 참고), 실제로는 API 레벨에서 전혀 막혀있지 않습니다. payouts(강사 정산 금액)도
--   마찬가지로 전체 강사의 정산 내역이 공개돼 있습니다.
--
--   이번 세션에서 발견된 것 중 가장 민감한 정보(여권/항공편)가 걸려있어 profiles보다도
--   시급한 건이었습니다.
--
-- 확인된 정상 기능(유지해야 함): 같은 투어 동승자끼리는 채팅방에서 서로의 성별·방번호·
--   코골이/흡연 여부·인원수·선택 옵션을 보고 있습니다(방 배정/그룹 로지스틱스 목적).
--   이 기능은 그대로 유지합니다. 결제금액·여권/항공편·취소/환불·동반자 명단·쿠폰코드는
--   지금도 본인/담당강사/관리자만 화면에 보여주고 있어서, 이 정보들만 실제로도 잠급니다.
--
-- 적용 방법: Supabase 대시보드 → SQL Editor에 아래 전체를 붙여넣고 실행(Run)
--   https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new
--
-- *** 이 SQL과 함께 반드시 코드 패치(fix_batch98_bookings_directory_frontend.patch)도 같은
-- 배포에 포함해야 합니다. 코드 없이 SQL만 적용하면 예약 목록/내 예약/채팅방이 깨집니다. ***
--
-- 문제가 생기면 fix_bookings_payouts_select_lockdown_rollback.sql로 즉시 되돌릴 수 있습니다.

-- ════════════════════════════════════════════════════════════════
-- 1) 헬퍼 함수 2개 추가 (batch97의 owns_tour/is_admin 재사용)
-- ════════════════════════════════════════════════════════════════

-- 이 예약(diver_id, tour_id)에 대해 "예약자 본인/담당강사/관리자"로서 결제금액·여권/
-- 항공편·취소사유·동반자 명단 같은 민감정보까지 볼 수 있는 사람인지.
create or replace function public.is_booking_staff(p_diver_id text, p_tour_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid()::text = p_diver_id
    or public.is_admin()
    or public.owns_tour(p_tour_id);
$$;
grant execute on function public.is_booking_staff(text, uuid) to anon, authenticated;

-- 이 예약(diver_id, tour_id)에 대해 "같은 투어 동승자"로서 방배정용 정보(이름/성별/
-- 방번호/코골이·흡연 여부/인원수/선택옵션)를 볼 수 있는 사람인지. staff를 포함한다.
create or replace function public.is_booking_companion(p_diver_id text, p_tour_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_booking_staff(p_diver_id, p_tour_id)
    or exists (
      select 1 from public.bookings mine
      where mine.tour_id = p_tour_id and mine.diver_id = auth.uid()::text
    );
$$;
grant execute on function public.is_booking_companion(text, uuid) to anon, authenticated;

-- ════════════════════════════════════════════════════════════════
-- 2) bookings_directory 뷰 — 컬럼별로 조건부 마스킹된 예약정보
-- ════════════════════════════════════════════════════════════════
create or replace view public.bookings_directory as
select
  b.id,
  b.tour_id,
  b.diver_id,
  b.status,
  b.created_at,
  case when public.is_booking_companion(b.diver_id, b.tour_id) then b.diver_name else null end as diver_name,
  case when public.is_booking_companion(b.diver_id, b.tour_id) then b.gender else null end as gender,
  case when public.is_booking_companion(b.diver_id, b.tour_id) then b.room_no else null end as room_no,
  case when public.is_booking_companion(b.diver_id, b.tour_id) then b.snoring else null end as snoring,
  case when public.is_booking_companion(b.diver_id, b.tour_id) then b.smoking else null end as smoking,
  case when public.is_booking_companion(b.diver_id, b.tour_id) then b.drinking else null end as drinking,
  case when public.is_booking_companion(b.diver_id, b.tour_id) then b.participant_count else null end as participant_count,
  case when public.is_booking_companion(b.diver_id, b.tour_id) then b.selected_options else null end as selected_options,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.base_price else null end as base_price,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.options_cost else null end as options_cost,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.platform_fee else null end as platform_fee,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.total_paid else null end as total_paid,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.on_site_balance else null end as on_site_balance,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.coupon_code else null end as coupon_code,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.discount_amount else null end as discount_amount,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.payment_method else null end as payment_method,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.room_note else null end as room_note,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.deposit_status else null end as deposit_status,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.cancel_reason else null end as cancel_reason,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.refund_rate else null end as refund_rate,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.refund_amount else null end as refund_amount,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.cancel_requested_at else null end as cancel_requested_at,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.evidence_file_names else null end as evidence_file_names,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.flight_info else null end as flight_info,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.passport_info else null end as passport_info,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.companion_names else null end as companion_names,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.companions else null end as companions
from public.bookings b;

grant select on public.bookings_directory to anon, authenticated;

-- ════════════════════════════════════════════════════════════════
-- 3) payouts_directory 뷰 — 강사 정산 금액은 본인 강사/관리자만
-- ════════════════════════════════════════════════════════════════
create or replace view public.payouts_directory as
select
  p.id,
  p.booking_id,
  p.instructor_id,
  p.status,
  p.created_at,
  case when public.owns_instructor(p.instructor_id) or public.is_admin() then p.first_amount else null end as first_amount,
  case when public.owns_instructor(p.instructor_id) or public.is_admin() then p.second_amount else null end as second_amount
from public.payouts p;

grant select on public.payouts_directory to anon, authenticated;

-- ════════════════════════════════════════════════════════════════
-- 4) bookings/payouts 테이블 자체의 select 정책 잠금 (직접 REST 호출 차단)
--    위 두 뷰는 뷰 소유자 권한으로 이 밑의 정책과 무관하게 계속 동작합니다.
-- ════════════════════════════════════════════════════════════════
drop policy if exists "bookings_public_select" on public.bookings;
drop policy if exists "bookings_select_all" on public.bookings;
create policy "bookings_select_own_or_tour_owner_or_admin" on public.bookings
  for select using (
    diver_id = auth.uid()::text or public.owns_tour(tour_id) or public.is_admin()
  );

drop policy if exists "payouts_public_select" on public.payouts;
drop policy if exists "payouts_select_all" on public.payouts;
create policy "payouts_select_own_instructor_or_admin" on public.payouts
  for select using (public.owns_instructor(instructor_id) or public.is_admin());

-- ════════════════════════════════════════════════════════════════
-- 완료. 아래로 정상 반영됐는지 확인할 수 있습니다.
-- ════════════════════════════════════════════════════════════════
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and tablename in ('bookings', 'payouts')
order by tablename, cmd;

select * from public.bookings_directory limit 3;
select * from public.payouts_directory limit 3;
