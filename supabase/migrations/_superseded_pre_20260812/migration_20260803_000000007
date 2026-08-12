-- ALL BLUE 다이빙 플랫폼 — 보안 강화 4단계: chat_messages/reports/inquiries/support_tickets 조회(select) 잠금
--
-- bookings/payouts를 점검하다가 같은 패턴(select 정책이 `using (true)`)이 이 4개 테이블에도
-- 그대로 남아있는 걸 추가로 발견했습니다. 특히 chat_messages는 전체 플랫폼의 모든 투어
-- 그룹채팅 메시지(사적인 대화 내용)가 로그인 여부와 무관하게 REST API로 전부 조회
-- 가능한 상태였습니다 — 이번 세션에서 발견된 것 중 여권/항공편 노출과 함께 가장 심각한
-- 건입니다.
--
--   - chat_messages: 투어 그룹채팅 메시지 전체 공개
--   - reports: 신고 내역(신고 대상/사유/상세설명) 전체 공개
--   - inquiries: 예약 관련 1:1 문의 내용 전체 공개
--   - support_tickets: 고객센터 문의(첨부파일명 포함) 전체 공개
--
-- 프론트엔드는 이미 각 화면에서 "내 것만" 걸러서 보여주고 있어서(마이페이지 문의내역,
-- 채팅방, 관리자 화면), 이 4개는 profiles/bookings처럼 컬럼별 마스킹 뷰가 필요 없고
-- 그냥 select 정책만 잠그면 됩니다 — 프론트엔드 코드 변경이나 배포가 전혀 필요 없습니다.
-- (기존 select * 쿼리가 그대로, 권한 있는 행만 자동으로 덜 받아오게 됩니다.)
--
-- 적용 방법: Supabase 대시보드 → SQL Editor에 아래 전체를 붙여넣고 실행(Run)
--   https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new
--
-- 문제가 생기면 fix_chat_reports_inquiries_tickets_select_lockdown_rollback.sql로
-- 즉시 되돌릴 수 있습니다.

-- ════════════════════════════════════════════════════════════════
-- 1) chat_messages — 그 투어의 참가자(예약한 다이버)/담당강사/관리자만 조회 가능
-- ════════════════════════════════════════════════════════════════
drop policy if exists "chat_messages_public_select" on public.chat_messages;
create policy "chat_messages_select_participant_or_admin" on public.chat_messages
  for select using (
    public.owns_tour(tour_id)
    or public.is_admin()
    or exists (
      select 1 from public.bookings b
      where b.tour_id = chat_messages.tour_id and b.diver_id = auth.uid()::text
    )
  );

-- ════════════════════════════════════════════════════════════════
-- 2) reports — 신고자를 식별하는 컬럼 자체가 없어(누가 신고했는지 기록 안 함) 관리자만
--    조회 가능하게 잠근다 (원래도 관리자 전용 화면에서만 쓰이고 있었음)
-- ════════════════════════════════════════════════════════════════
drop policy if exists "reports_public_select" on public.reports;
create policy "reports_select_admin" on public.reports
  for select using (public.is_admin());

-- ════════════════════════════════════════════════════════════════
-- 3) inquiries — 문의한 본인 다이버 또는 관리자만 조회 가능
-- ════════════════════════════════════════════════════════════════
drop policy if exists "inquiries_public_select" on public.inquiries;
create policy "inquiries_select_own_or_admin" on public.inquiries
  for select using (diver_id = auth.uid()::text or public.is_admin());

-- ════════════════════════════════════════════════════════════════
-- 4) support_tickets — 접수한 본인 또는 관리자만 조회 가능
-- ════════════════════════════════════════════════════════════════
drop policy if exists "support_tickets_public_select" on public.support_tickets;
create policy "support_tickets_select_own_or_admin" on public.support_tickets
  for select using (user_id = auth.uid()::text or public.is_admin());

-- ════════════════════════════════════════════════════════════════
-- 완료. 아래로 정상 반영됐는지 확인할 수 있습니다.
-- ════════════════════════════════════════════════════════════════
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('chat_messages', 'reports', 'inquiries', 'support_tickets')
order by tablename, cmd;
