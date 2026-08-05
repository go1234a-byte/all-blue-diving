#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — batch92: profiles.birth_date 컬럼 마이그레이션 기록
#
# *** 중요: 이 스크립트만 실행해서는 버그가 고쳐지지 않습니다. ***
# 실제로 DB에 컬럼을 추가하려면 Supabase 대시보드 SQL Editor에서
# fix_profiles_birth_date_column.sql 내용을 직접 실행해야 합니다:
#   https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new
#
# 증상: 다이버 가입/마이페이지에서 생년월일을 입력해도 저장되지 않음
#   (profiles 테이블에 birth_date 컬럼이 아예 없음)
#
# 사용법: all-blue-diving 리포지토리 루트에서 실행
#   chmod +x fix_batch92_profiles_birth_date.sh
#   ./fix_batch92_profiles_birth_date.sh
set -euo pipefail

if [ ! -d "supabase/migrations" ]; then
  echo "오류: all-blue-diving 리포지토리 루트에서 실행해야 합니다 (supabase/migrations 를 찾을 수 없음)."
  exit 1
fi

TARGET="supabase/migrations/migration_20260803_000000002"

if [ -f "$TARGET" ]; then
  echo "이미 존재합니다: $TARGET (변경 없이 종료)"
  exit 0
fi

cat > "$TARGET" <<'SQLEOF'
-- profiles.birth_date 컬럼 추가 (batch92)
-- 다이버 가입/마이페이지에서 생년월일이 저장되지 않던 버그의 원인.
-- Supabase SQL Editor에서 직접 실행 완료 후 기록용으로 커밋.
alter table public.profiles
  add column if not exists birth_date date;
SQLEOF

echo "1) 마이그레이션 파일 생성 완료: $TARGET"
echo ""
echo "*** 반드시 아래도 진행하세요 (이 파일을 커밋하는 것만으로는 DB가 바뀌지 않습니다) ***"
echo "  1. https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new 접속"
echo "  2. fix_profiles_birth_date_column.sql 파일 내용 전체 복사해서 붙여넣기 후 Run"
echo "  3. 결과에 birth_date / date 행이 나오는지 확인"
echo ""
echo "완료되면:"
echo "  git add supabase/migrations/migration_20260803_000000002"
echo "  git commit -m 'fix: profiles.birth_date 컬럼 누락 수정 (batch92)'"
echo "  git push"
