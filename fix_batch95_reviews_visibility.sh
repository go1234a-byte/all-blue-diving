#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — batch95: reviews.visibility 컬럼 마이그레이션 기록
#
# *** 중요: 이 스크립트만 실행해서는 버그가 고쳐지지 않습니다. ***
# 실제로 DB에 컬럼을 추가하려면 Supabase 대시보드 SQL Editor에서
# fix_reviews_visibility_column.sql 내용을 직접 실행해야 합니다:
#   https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new
#
# 증상: 다이버가 후기를 작성하면 화면엔 성공한 것처럼 보이지만 실제로는 DB에
#   저장되지 않고 새로고침하면 사라짐 (reviews 테이블에 visibility 컬럼이 없음).
#
# 사용법: all-blue-diving 리포지토리 루트에서 실행
#   chmod +x fix_batch95_reviews_visibility.sh
#   ./fix_batch95_reviews_visibility.sh
set -euo pipefail

if [ ! -d "supabase/migrations" ]; then
  echo "오류: all-blue-diving 리포지토리 루트에서 실행해야 합니다 (supabase/migrations 를 찾을 수 없음)."
  exit 1
fi

TARGET="supabase/migrations/migration_20260803_000000003"

if [ -f "$TARGET" ]; then
  echo "이미 존재합니다: $TARGET (변경 없이 종료)"
  exit 0
fi

cat > "$TARGET" <<'SQLEOF'
-- reviews.visibility 컬럼 추가 (batch95)
-- 후기 작성이 항상 실패(화면엔 성공처럼 보이지만 DB에 저장 안 됨)하던 버그의 원인.
-- Supabase SQL Editor에서 직접 실행 완료 후 기록용으로 커밋.
alter table public.reviews
  add column if not exists visibility text not null default 'public'
    check (visibility in ('public', 'instructor_only'));
SQLEOF

echo "1) 마이그레이션 파일 생성 완료: $TARGET"
echo ""
echo "*** 반드시 아래도 진행하세요 (이 파일을 커밋하는 것만으로는 DB가 바뀌지 않습니다) ***"
echo "  1. https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new 접속"
echo "  2. fix_reviews_visibility_column.sql 파일 내용 전체 복사해서 붙여넣기 후 Run"
echo "  3. 결과에 visibility / text / 'public'::text 행이 나오는지 확인"
echo ""
echo "완료되면:"
echo "  git add supabase/migrations/migration_20260803_000000003"
echo "  git commit -m 'fix: reviews.visibility 컬럼 누락으로 후기 작성이 항상 실패하던 문제 수정 (batch95)'"
echo "  git push"
