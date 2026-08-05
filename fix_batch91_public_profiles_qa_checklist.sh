#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — batch91: public_profiles 뷰 / qa_checklist_results 테이블 마이그레이션 기록
#
# *** 중요: 이 스크립트만 실행해서는 버그가 고쳐지지 않습니다. ***
# 이 스크립트는 "레포에 마이그레이션 기록을 남기는 것"만 합니다.
# 실제로 DB에 뷰/테이블을 만들려면 Supabase 대시보드 SQL Editor에서
# fix_public_profiles_and_qa_checklist.sql 내용을 직접 실행해야 합니다:
#   https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new
#
# 증상:
#   1) 강사 공개 프로필 페이지 - 리뷰 작성자 이름 빈 값, 강사 정지 뱃지 미표시
#      (public_profiles 뷰가 없어서 GET 요청이 항상 404)
#   2) 관리자 QA 체크리스트 페이지 - 결과 저장/불러오기 실패
#      (qa_checklist_results 테이블 자체가 없음)
#
# 사용법: all-blue-diving 리포지토리 루트에서 실행
#   chmod +x fix_batch91_public_profiles_qa_checklist.sh
#   ./fix_batch91_public_profiles_qa_checklist.sh
set -euo pipefail

if [ ! -d "supabase/migrations" ]; then
  echo "오류: all-blue-diving 리포지토리 루트에서 실행해야 합니다 (supabase/migrations 를 찾을 수 없음)."
  exit 1
fi

TARGET="supabase/migrations/migration_20260803_000000001"

if [ -f "$TARGET" ]; then
  echo "이미 존재합니다: $TARGET (변경 없이 종료)"
  exit 0
fi

cat > "$TARGET" <<'SQLEOF'
-- public_profiles 뷰 + qa_checklist_results 테이블 추가 (batch91)
-- 강사 공개 프로필 리뷰 작성자 이름/정지 뱃지 미표시, 관리자 QA 체크리스트 저장 실패 버그의 원인.
-- Supabase SQL Editor에서 직접 실행 완료 후 기록용으로 커밋.

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

create table if not exists public.qa_checklist_results (
  item_id integer primary key,
  status text not null default '미확인' check (status in ('미확인', 'Pass', 'Fail', 'N/A', '진행중')),
  note text,
  checked_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.qa_checklist_results enable row level security;

drop policy if exists "qa_checklist_results_public_select" on public.qa_checklist_results;
create policy "qa_checklist_results_public_select" on public.qa_checklist_results for select using (true);

drop policy if exists "qa_checklist_results_public_upsert" on public.qa_checklist_results;
create policy "qa_checklist_results_public_upsert" on public.qa_checklist_results for insert with check (true);

drop policy if exists "qa_checklist_results_public_update" on public.qa_checklist_results;
create policy "qa_checklist_results_public_update" on public.qa_checklist_results for update using (true) with check (true);
SQLEOF

echo "1) 마이그레이션 파일 생성 완료: $TARGET"
echo ""
echo "*** 반드시 아래도 진행하세요 (이 파일을 커밋하는 것만으로는 DB가 바뀌지 않습니다) ***"
echo "  1. https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new 접속"
echo "  2. fix_public_profiles_and_qa_checklist.sql 파일 내용 전체 복사해서 붙여넣기 후 Run"
echo "  3. 맨 아래 두 select 결과가 에러 없이 나오는지 확인"
echo ""
echo "완료되면:"
echo "  git add supabase/migrations/migration_20260803_000000001"
echo "  git commit -m 'fix: public_profiles 뷰 + qa_checklist_results 테이블 누락 수정 (batch91)'"
echo "  git push"
