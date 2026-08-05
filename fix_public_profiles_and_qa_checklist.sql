-- ALL BLUE 다이빙 플랫폼 — 긴급 수정: public_profiles 뷰 / qa_checklist_results 테이블 누락
--
-- 증상:
--   1) 강사 공개 프로필 페이지에서 리뷰 작성자(다이버) 이름이 빈 값으로 표시됨
--      + 강사가 "정지" 처리돼도 방문자에게 정지 뱃지가 표시되지 않음
--   2) 관리자 QA 체크리스트 페이지(AdminQaChecklistPage)에서
--      "체크리스트 결과를 불러오지 못했습니다" 에러가 뜰 가능성이 높음
--
-- 원인: 지금까지 이 프로젝트에서 4번째로 발견된 동일 패턴 — 프론트엔드 코드는 이미
--   이 DB 객체들(뷰/테이블)을 전제로 배포됐지만, 실제로 만드는 마이그레이션이 한 번도
--   실행된 적이 없음. 실제로 사이트에서 새로고침할 때마다
--     GET /rest/v1/public_profiles → 404 (PGRST205, Could not find the table)
--   가 발생하는 것을 네트워크 로그로 직접 확인함.
--
-- 적용 방법: Supabase 대시보드 → SQL Editor에 아래 전체를 붙여넣고 실행(Run)
--   https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new

-- 1) public_profiles 뷰
--    profiles 테이블에서 이름/역할/상태/가입일만 노출하는 공개용 뷰.
--    전화번호, C카드 번호, 비상연락처 등 민감정보는 포함하지 않는다.
--    강사 공개 프로필 페이지에서 리뷰 작성자 이름, 강사 정지 상태 표시에 사용됨.
create or replace view public.public_profiles as
select
  id,
  role,
  name,
  status,
  created_at
from public.profiles
where deleted_at is null;

grant select on public.public_profiles to anon, authenticated;

-- 2) qa_checklist_results 테이블
--    관리자 QA 체크리스트 페이지에서 300개 체크리스트 항목별 결과(Pass/Fail/진행중 등)와
--    비고를 저장하는 테이블. item_id로 정적 체크리스트 데이터(src/lib/qaChecklistData.ts)와 매핑됨.
create table if not exists public.qa_checklist_results (
  item_id integer primary key,
  status text not null default '미확인' check (status in ('미확인', 'Pass', 'Fail', 'N/A', '진행중')),
  note text,
  checked_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.qa_checklist_results enable row level security;

-- 이 프로젝트의 기존 테이블들과 동일한 컨벤션(RLS는 열어두고 클라이언트단에서 관리자만
-- 접근하도록 라우팅으로 제한)을 따른다 — reports/payouts 등도 동일한 패턴.
drop policy if exists "qa_checklist_results_public_select" on public.qa_checklist_results;
create policy "qa_checklist_results_public_select" on public.qa_checklist_results for select using (true);

drop policy if exists "qa_checklist_results_public_upsert" on public.qa_checklist_results;
create policy "qa_checklist_results_public_upsert" on public.qa_checklist_results for insert with check (true);

drop policy if exists "qa_checklist_results_public_update" on public.qa_checklist_results;
create policy "qa_checklist_results_public_update" on public.qa_checklist_results for update using (true) with check (true);

-- 확인용: 아래 두 조회 모두 에러 없이 결과가 나오면 정상
select * from public.public_profiles limit 5;
select * from public.qa_checklist_results limit 5;
