-- ALL BLUE 다이빙 플랫폼 — 긴급 수정: 후기(리뷰) 작성이 항상 실패하는 문제
--
-- 증상: 다이버가 투어 후기를 작성하면 화면에는 정상 등록된 것처럼 보이지만,
--   실제로는 DB에 전혀 저장되지 않고 새로고침하면 사라짐.
--
-- 원인: 이번 세션에서 6번째로 발견된 동일 패턴 — 프론트엔드(addReview)는 이미
--   reviews.visibility 컬럼("public" | "instructor_only")을 전제로 매번 insert
--   payload에 포함시키지만, 이 컬럼을 실제로 추가하는 마이그레이션이 한 번도
--   실행된 적이 없음. 컬럼이 없으니 insert 자체가 매번 실패하고, 코드에 있는
--   "실패 시 로컬 상태에만 낙관적으로 반영" 폴백 때문에 화면에서는 성공한 것처럼
--   보이지만 실제로는 저장이 전혀 안 됨. 지금까지 겪으신 "참가자 수 0으로 표시",
--   "생년월일 안 저장" 버그와 완전히 동일한 원인.
--
-- 적용 방법: Supabase 대시보드 → SQL Editor에 아래 전체를 붙여넣고 실행(Run)
--   https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new

alter table public.reviews
  add column if not exists visibility text not null default 'public'
    check (visibility in ('public', 'instructor_only'));

-- 확인용: 컬럼이 정상적으로 추가됐는지 확인
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'reviews' and column_name = 'visibility';
