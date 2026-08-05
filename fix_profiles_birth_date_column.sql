-- ALL BLUE 다이빙 플랫폼 — 긴급 수정: 다이버 생년월일이 저장되지 않는 문제
--
-- 증상: 다이버 회원가입/마이페이지에서 생년월일을 입력해도 저장되지 않고,
--   마이페이지에 "생년월일·나이: -"로 항상 빈 값이 표시됨.
--   (실제로 새 다이버 계정으로 가입 테스트해서 재현/확인함)
--
-- 원인: 이 프로젝트에서 5번째로 발견된 동일 패턴 — 프론트엔드(DiverSignupForm,
--   AppDataContext의 updateDiverProfile)는 이미 profiles.birth_date 컬럼을 전제로
--   배포됐지만, 이 컬럼을 실제로 추가하는 마이그레이션이 한 번도 실행된 적이 없음.
--   가입 시점에는 코드에 방어 로직이 있어 "생년월일만 빼고" 가입 자체는 되지만,
--   마이페이지에서 나중에 재입력해도 똑같이 저장되지 않음.
--
-- 적용 방법: Supabase 대시보드 → SQL Editor에 아래 전체를 붙여넣고 실행(Run)
--   https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new

alter table public.profiles
  add column if not exists birth_date date;

-- 확인용: 컬럼이 정상적으로 추가됐는지 확인
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles' and column_name = 'birth_date';
