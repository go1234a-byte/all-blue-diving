#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — batch100: penalties_log 조회 잠금 마이그레이션 기록
#
# *** 이 스크립트만 실행해서는 보안이 강화되지 않습니다. ***
# 실제로 DB 정책을 바꾸려면 Supabase 대시보드 SQL Editor에서
# fix_penalties_log_select_lockdown.sql 내용을 직접 실행해야 합니다:
#   https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new
#
# *** 코드 패치 필요 없음 *** — 관리자 전용 데이터라 SQL만 적용하면 됩니다.
#
# 사용법: all-blue-diving 리포지토리 루트에서 실행
#   chmod +x fix_batch100_penalties_log_select_lockdown.sh
#   ./fix_batch100_penalties_log_select_lockdown.sh
set -euo pipefail

if [ ! -d "supabase/migrations" ]; then
  echo "오류: all-blue-diving 리포지토리 루트에서 실행해야 합니다 (supabase/migrations 를 찾을 수 없음)."
  exit 1
fi

SRC_SQL="$(dirname "$0")/fix_penalties_log_select_lockdown.sql"
TARGET="supabase/migrations/migration_20260803_000000008"

if [ ! -f "$SRC_SQL" ]; then
  echo "오류: $SRC_SQL 를 찾을 수 없습니다. fix_penalties_log_select_lockdown.sql 을 같은 폴더에 두고 실행하세요."
  exit 1
fi

cp "$SRC_SQL" "$TARGET"

echo "1) 마이그레이션 파일 생성 완료: $TARGET"
echo ""
echo "*** 반드시 아래도 진행하세요 ***"
echo "  1. https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new 접속"
echo "  2. fix_penalties_log_select_lockdown.sql 파일 내용 전체 복사해서 붙여넣기 후 Run"
echo ""
echo "완료되면:"
echo "  git add supabase/migrations/migration_20260803_000000008"
echo "  git commit -m 'security: penalties_log 조회(select) 잠금 - 관리자만 (batch100)'"
echo "  git push"
echo ""
echo "문제가 생기면: fix_penalties_log_select_lockdown_rollback.sql 을 SQL Editor에서 실행해 되돌리세요."
