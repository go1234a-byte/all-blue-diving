-- ALL BLUE 다이빙 플랫폼 — 보안 강화 1단계: 쓰기(등록/수정/삭제) 권한 잠금
--
-- 문제: 지금까지 거의 모든 테이블의 RLS 정책이 `using (true)` / `with check (true)`로
--   되어 있습니다. 즉 로그인 여부·역할과 무관하게 누구나 Supabase REST API를 직접 호출하면
--   (앱 화면을 거치지 않고) 다른 사람의 예약을 수정하거나, 본인 강사 계정을 스스로 인증
--   처리하거나, 아무 쿠폰이나 관리자 권한으로 만들거나, 다른 사람 프로필 상태를 바꾸는 것도
--   전부 가능한 상태입니다. 지금까지는 "화면(프론트엔드)에서만" 권한을 막고 있었습니다.
--
-- 이번 수정 범위: 조회(select)는 이번 단계에서 건드리지 않습니다 (프로필 등 일부 테이블은
--   앱이 "전체를 한번에 불러와 화면에서 걸러서 보여주는" 구조라, select를 잠그려면 프론트엔드
--   데이터 조회 방식 자체를 바꿔야 해서 별도 2단계로 진행합니다). 이번엔 등록/수정/삭제만
--   실제 소유자(본인) 또는 관리자만 가능하도록 좁힙니다.
--
-- 소유자 판정이 까다로운 이유: 다이버는 profiles.id(=auth.uid())로 식별되지만, 강사는
--   별도의 instructors.id(예: "inst-1")를 쓰고 이게 profiles.id와 instructors.profile_id로
--   연결되는 구조라 단순 비교가 아니라 조인이 필요합니다. 아래 헬퍼 함수들이 이 조인을
--   대신 해줍니다.
--
-- 예외 처리(RPC로 분리): 자동마감 처리(누구든 화면을 열면 트리거될 수 있음), 리뷰 "신고"
--   (신고자가 리뷰 소유자가 아님), 쿠폰 사용횟수 증가(구매자가 쿠폰 소유자가 아님),
--   탈퇴 후 재가입 제한 확인(로그인 전에 확인해야 함) — 이 네 가지는 "소유자가 아닌 사람이
--   특정 필드 하나만 안전하게 바꿔야 하는" 경우라, 일반 update 정책으로는 표현이 안 되거나
--   과도하게 열어야 해서 대신 범위를 좁힌 함수(RPC)로 처리합니다.
--
-- 적용 방법: Supabase 대시보드 → SQL Editor에 아래 전체를 붙여넣고 실행(Run)
--   https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new
--
-- 적용 후 반드시 로그인/예약/강사 투어관리/채팅/관리자 화면을 한 번씩 테스트해주세요.
-- 문제가 생기면 fix_rls_write_lockdown_rollback.sql로 즉시 이전 상태로 되돌릴 수 있습니다.

-- ════════════════════════════════════════════════════════════════
-- 0) 헬퍼 함수 — 정책마다 반복되는 "이 사람이 이 강사/투어/예약의 주인인가?" 판정
-- ════════════════════════════════════════════════════════════════

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- 로그인한 사람이 이 instructors.id 레코드의 실제 주인(profile_id)인지
create or replace function public.owns_instructor(p_instructor_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.instructors
    where id = p_instructor_id and profile_id = auth.uid()::text
  );
$$;
grant execute on function public.owns_instructor(text) to anon, authenticated;

-- 로그인한 사람이 이 투어(tours.id)를 담당하는 강사인지
create or replace function public.owns_tour(p_tour_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.tours
    where id = p_tour_id and public.owns_instructor(instructor_id)
  );
$$;
grant execute on function public.owns_tour(uuid) to anon, authenticated;

-- 로그인한 사람이 이 예약(bookings.id)의 예약자 본인인지
create or replace function public.owns_booking(p_booking_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.bookings
    where id = p_booking_id and diver_id = auth.uid()::text
  );
$$;
grant execute on function public.owns_booking(uuid) to anon, authenticated;

-- 로그인한 사람이 이 예약이 속한 투어의 담당 강사인지
create or replace function public.owns_booking_tour(p_booking_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.bookings b
    where b.id = p_booking_id and public.owns_tour(b.tour_id)
  );
$$;
grant execute on function public.owns_booking_tour(uuid) to anon, authenticated;

-- ════════════════════════════════════════════════════════════════
-- 1) profiles — 본인 또는 관리자만 수정 가능하도록 관리자 조건 추가
--    (기존 auth.uid() = id 조건은 그대로 두고, 관리자 경고/정지 처리를 위해 추가)
-- ════════════════════════════════════════════════════════════════
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- ════════════════════════════════════════════════════════════════
-- 2) tours — 담당 강사 본인 또는 관리자만 등록/수정, 삭제는 관리자만
--    (자동마감 처리는 이 정책이 아니라 아래 apply_tour_auto_close() RPC로 처리)
-- ════════════════════════════════════════════════════════════════
drop policy if exists "tours_public_insert" on public.tours;
drop policy if exists "tours_public_update" on public.tours;
create policy "tours_insert_own" on public.tours
  for insert with check (public.owns_instructor(instructor_id));
create policy "tours_update_own_or_admin" on public.tours
  for update using (public.owns_instructor(instructor_id) or public.is_admin())
  with check (public.owns_instructor(instructor_id) or public.is_admin());
create policy "tours_delete_admin" on public.tours
  for delete using (public.is_admin());

-- 자동마감 평가는 누구 화면에서 트리거되든(다이버든 강사든) 안전하게 상태만 바꿔야 하므로
-- 일반 update 정책 대신 이 함수로만 처리한다. 조건(open 상태 + 아직 미처리)을 함수 내부에서
-- 다시 한번 검증하므로, 이미 처리된 투어를 반복 호출해도 아무 일도 일어나지 않는다.
create or replace function public.apply_tour_auto_close(
  p_tour_id uuid,
  p_meets_minimum boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_meets_minimum then
    update public.tours
    set status = 'closed', auto_close_processed = true
    where id = p_tour_id and status = 'open' and auto_close_processed = false;
  else
    update public.tours
    set status = 'closed', auto_close_processed = true, under_min_decision_pending = true
    where id = p_tour_id and status = 'open' and auto_close_processed = false;
  end if;
end;
$$;
grant execute on function public.apply_tour_auto_close(uuid, boolean) to anon, authenticated;

-- ════════════════════════════════════════════════════════════════
-- 3) bookings — 예약자 본인, 담당 강사, 관리자만 등록/수정
-- ════════════════════════════════════════════════════════════════
drop policy if exists "bookings_public_insert" on public.bookings;
drop policy if exists "bookings_public_update" on public.bookings;
create policy "bookings_insert_own" on public.bookings
  for insert with check (diver_id = auth.uid()::text);
create policy "bookings_update_own_or_tour_owner_or_admin" on public.bookings
  for update using (
    diver_id = auth.uid()::text or public.owns_tour(tour_id) or public.is_admin()
  )
  with check (
    diver_id = auth.uid()::text or public.owns_tour(tour_id) or public.is_admin()
  );

-- ════════════════════════════════════════════════════════════════
-- 4) reviews — 작성자 본인이 등록, 작성자/담당 강사(답글)/관리자가 수정
--    "신고" 버튼은 신고자가 리뷰 주인이 아니므로 아래 report_review() RPC로 분리
-- ════════════════════════════════════════════════════════════════
drop policy if exists "reviews_public_insert" on public.reviews;
drop policy if exists "reviews_public_update" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert with check (diver_id = auth.uid()::text);
create policy "reviews_update_own_or_instructor_or_admin" on public.reviews
  for update using (
    diver_id = auth.uid()::text
    or (instructor_id is not null and public.owns_instructor(instructor_id))
    or public.is_admin()
  )
  with check (
    diver_id = auth.uid()::text
    or (instructor_id is not null and public.owns_instructor(instructor_id))
    or public.is_admin()
  );

create or replace function public.report_review(p_review_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.reviews set reported = true where id = p_review_id;
$$;
grant execute on function public.report_review(uuid) to anon, authenticated;

-- ════════════════════════════════════════════════════════════════
-- 5) reports — 로그인한 사람 누구나 등록(신고), 처리는 관리자만
-- ════════════════════════════════════════════════════════════════
drop policy if exists "reports_public_insert" on public.reports;
drop policy if exists "reports_public_update" on public.reports;
create policy "reports_insert_authenticated" on public.reports
  for insert with check (auth.uid() is not null);
create policy "reports_update_admin" on public.reports
  for update using (public.is_admin()) with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════
-- 6) payouts — 예약자 본인(예약 시 자동 생성) 또는 담당 강사/관리자만
-- ════════════════════════════════════════════════════════════════
drop policy if exists "payouts_public_insert" on public.payouts;
drop policy if exists "payouts_public_update" on public.payouts;
create policy "payouts_insert_own_booking_or_admin" on public.payouts
  for insert with check (public.owns_booking(booking_id) or public.is_admin());
create policy "payouts_update_related_or_admin" on public.payouts
  for update using (
    public.owns_booking(booking_id) or public.owns_booking_tour(booking_id) or public.is_admin()
  )
  with check (
    public.owns_booking(booking_id) or public.owns_booking_tour(booking_id) or public.is_admin()
  );

-- ════════════════════════════════════════════════════════════════
-- 7) inquiries — 작성자 본인만 등록, 답변 처리는 관리자만
-- ════════════════════════════════════════════════════════════════
drop policy if exists "inquiries_public_insert" on public.inquiries;
drop policy if exists "inquiries_public_update" on public.inquiries;
create policy "inquiries_insert_own" on public.inquiries
  for insert with check (diver_id = auth.uid()::text);
create policy "inquiries_update_admin" on public.inquiries
  for update using (public.is_admin()) with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════
-- 8) coupons — 관리자만 등록/수정/삭제. 사용횟수 증가는 redeem_coupon() RPC로만.
-- ════════════════════════════════════════════════════════════════
drop policy if exists "coupons_insert_all" on public.coupons;
drop policy if exists "coupons_update_all" on public.coupons;
drop policy if exists "coupons_delete_all" on public.coupons;
create policy "coupons_insert_admin" on public.coupons
  for insert with check (public.is_admin());
create policy "coupons_update_admin" on public.coupons
  for update using (public.is_admin()) with check (public.is_admin());
create policy "coupons_delete_admin" on public.coupons
  for delete using (public.is_admin());

-- 결제 시 쿠폰 사용횟수를 안전하게 +1 (한도 초과/비활성 쿠폰은 조용히 무시)
create or replace function public.redeem_coupon(p_coupon_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.coupons
  set used_count = used_count + 1
  where id = p_coupon_id
    and active = true
    and (usage_limit is null or used_count < usage_limit);
end;
$$;
grant execute on function public.redeem_coupon(uuid) to authenticated;

-- ════════════════════════════════════════════════════════════════
-- 9) instructors — 본인(강사 가입 시) 또는 관리자(승인/페널티)만 등록/수정
-- ════════════════════════════════════════════════════════════════
drop policy if exists "instructors_public_insert" on public.instructors;
drop policy if exists "instructors_public_update" on public.instructors;
create policy "instructors_insert_own" on public.instructors
  for insert with check (profile_id = auth.uid()::text);
create policy "instructors_update_own_or_admin" on public.instructors
  for update using (profile_id = auth.uid()::text or public.is_admin())
  with check (profile_id = auth.uid()::text or public.is_admin());

-- ════════════════════════════════════════════════════════════════
-- 10) centers — 강사(투어 생성 중 신규 센터 등록) 또는 관리자만 등록, 수정/삭제는 관리자만
-- ════════════════════════════════════════════════════════════════
drop policy if exists "centers_public_insert" on public.centers;
drop policy if exists "centers_public_update" on public.centers;
create policy "centers_insert_instructor_or_admin" on public.centers
  for insert with check (
    public.is_admin()
    or exists(select 1 from public.profiles where id = auth.uid() and role = 'instructor')
  );
create policy "centers_update_admin" on public.centers
  for update using (public.is_admin()) with check (public.is_admin());
create policy "centers_delete_admin" on public.centers
  for delete using (public.is_admin());

-- ════════════════════════════════════════════════════════════════
-- 11) support_tickets — 로그인한 사람 누구나 등록, 답변/상태변경은 관리자만
-- ════════════════════════════════════════════════════════════════
drop policy if exists "support_tickets_public_insert" on public.support_tickets;
drop policy if exists "support_tickets_public_update" on public.support_tickets;
create policy "support_tickets_insert_authenticated" on public.support_tickets
  for insert with check (auth.uid() is not null);
create policy "support_tickets_update_admin" on public.support_tickets
  for update using (public.is_admin()) with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════
-- 12) penalties_log — 관리자만 등록 (강사 페널티 부여)
-- ════════════════════════════════════════════════════════════════
drop policy if exists "penalties_log_public_insert" on public.penalties_log;
create policy "penalties_log_insert_admin" on public.penalties_log
  for insert with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════
-- 13) chat_messages — 본인 명의로만, 그 투어의 참가자(담당 강사/예약한 다이버)나 관리자만 등록
-- ════════════════════════════════════════════════════════════════
drop policy if exists "chat_messages_public_insert" on public.chat_messages;
create policy "chat_messages_insert_participant" on public.chat_messages
  for insert with check (
    sender_profile_id = auth.uid()::text
    and (
      public.owns_tour(tour_id)
      or exists(select 1 from public.bookings where tour_id = chat_messages.tour_id and diver_id = auth.uid()::text)
      or public.is_admin()
    )
  );

-- ════════════════════════════════════════════════════════════════
-- 14) qa_checklist_results — 관리자만 조회/등록/수정 (관리자 전용 내부 도구)
-- ════════════════════════════════════════════════════════════════
drop policy if exists "qa_checklist_results_public_select" on public.qa_checklist_results;
drop policy if exists "qa_checklist_results_public_upsert" on public.qa_checklist_results;
drop policy if exists "qa_checklist_results_public_update" on public.qa_checklist_results;
create policy "qa_checklist_results_admin_select" on public.qa_checklist_results
  for select using (public.is_admin());
create policy "qa_checklist_results_admin_insert" on public.qa_checklist_results
  for insert with check (public.is_admin());
create policy "qa_checklist_results_admin_update" on public.qa_checklist_results
  for update using (public.is_admin()) with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════
-- 15) deleted_accounts — 이메일/전화번호가 담긴 민감정보라 완전히 잠그고,
--     "탈퇴 후 6개월 이내인지"만 확인하는 is_recently_deleted_account() RPC로 대체.
--     (기존엔 select가 완전 공개라 로그인 없이도 탈퇴회원 전체 이메일/전화번호 조회가 가능했음)
-- ════════════════════════════════════════════════════════════════
drop policy if exists "deleted_accounts_service_only_select" on public.deleted_accounts;
drop policy if exists "deleted_accounts_service_only_insert" on public.deleted_accounts;
create policy "deleted_accounts_admin_select" on public.deleted_accounts
  for select using (public.is_admin());
create policy "deleted_accounts_insert_self_or_admin" on public.deleted_accounts
  for insert with check (original_user_id = auth.uid() or public.is_admin());

create or replace function public.is_recently_deleted_account(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.deleted_accounts
    where email = p_email and deleted_at >= (now() - interval '6 months')
  );
$$;
grant execute on function public.is_recently_deleted_account(text) to anon, authenticated;

-- ════════════════════════════════════════════════════════════════
-- 완료. 아래로 원래 저장돼있던 정책이 잘 바뀌었는지 확인할 수 있습니다.
-- ════════════════════════════════════════════════════════════════
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles','tours','bookings','reviews','reports','payouts','inquiries',
    'coupons','instructors','centers','support_tickets','penalties_log',
    'chat_messages','qa_checklist_results','deleted_accounts'
  )
order by tablename, cmd;
