-- ALL BLUE 다이빙 플랫폼 — 보안 강화 5단계: penalties_log(강사 제재 이력) 조회 잠금
--
-- penalties_log(강사 위반/제재 사유·설명) 테이블의 select 정책이 아직 `using (true)` —
-- 로그인 여부와 무관하게 전체 강사의 제재 이력을 REST API로 조회할 수 있는 상태입니다.
-- 코드 전체를 확인해보니 관리자 대시보드(PenaltyWarningPanel)에서만 쓰이고 있고
-- 일반 사용자 화면에는 노출되지 않아서, 공개될 이유가 없는 데이터입니다.
--
-- 코드 패치 필요 없음 — 관리자만 쓰는 데이터라 admin 계정은 계속 전체를 볼 수 있고,
-- 일반 사용자는 원래도 이 데이터를 화면에서 쓰지 않으므로 영향 없습니다.
--
-- 적용 방법: Supabase 대시보드 → SQL Editor에 아래 전체를 붙여넣고 실행(Run)
--   https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new
--
-- 문제가 생기면 fix_penalties_log_select_lockdown_rollback.sql로 즉시 되돌릴 수 있습니다.

drop policy if exists "penalties_log_public_select" on public.penalties_log;
create policy "penalties_log_select_admin" on public.penalties_log
  for select using (public.is_admin());

-- 확인용
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'penalties_log'
order by cmd;
