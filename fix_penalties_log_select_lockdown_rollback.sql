-- ALL BLUE 다이빙 플랫폼 — 롤백: penalties_log 조회 잠금 되돌리기
drop policy if exists "penalties_log_select_admin" on public.penalties_log;
create policy "penalties_log_public_select" on public.penalties_log for select using (true);
