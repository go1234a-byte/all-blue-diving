-- ALL BLUE 다이빙 플랫폼 — 롤백: 보안 강화 4단계(채팅/신고/문의/고객센터 조회 잠금) 되돌리기
--
-- fix_chat_reports_inquiries_tickets_select_lockdown.sql 적용 후 채팅방/마이페이지 문의내역/
-- 고객센터/관리자 화면이 깨지면, 이 파일을 Supabase SQL Editor에서 실행해 즉시 이전 상태
-- (전체 공개 조회)로 되돌릴 수 있습니다.

drop policy if exists "chat_messages_select_participant_or_admin" on public.chat_messages;
create policy "chat_messages_public_select" on public.chat_messages for select using (true);

drop policy if exists "reports_select_admin" on public.reports;
create policy "reports_public_select" on public.reports for select using (true);

drop policy if exists "inquiries_select_own_or_admin" on public.inquiries;
create policy "inquiries_public_select" on public.inquiries for select using (true);

drop policy if exists "support_tickets_select_own_or_admin" on public.support_tickets;
create policy "support_tickets_public_select" on public.support_tickets for select using (true);
