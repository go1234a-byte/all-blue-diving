-- 강사 제재 이력(penalties_log) 조회 잠금 — 예전 batch100으로 기록만 되고 실제 반영은
-- 안 됐던 부분. 코드 전체 확인 결과 관리자 대시보드(PenaltyWarningPanel,
-- AdminInstructorsPage)에서만 쓰이고 일반 사용자 화면에는 노출되지 않아 프론트엔드
-- 코드 변경 없이 안전하게 잠글 수 있다.
drop policy if exists "penalties_log_public_select" on public.penalties_log;

create policy "penalties_log_select_admin" on public.penalties_log
  for select using (public.is_admin());
