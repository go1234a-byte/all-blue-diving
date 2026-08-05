#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — batch98: bookings/payouts 조회 잠금 마이그레이션 기록
#
# *** 이 스크립트만 실행해서는 보안이 강화되지 않습니다. ***
# 실제로 DB 정책을 바꾸려면 Supabase 대시보드 SQL Editor에서
# fix_bookings_payouts_select_lockdown.sql 내용을 직접 실행해야 합니다:
#   https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new
#
# 이 batch는 코드 패치(fix_batch98_bookings_directory_frontend.patch)와 반드시 함께
# 적용해야 합니다 — SQL만 적용하고 코드를 안 바꾸면 예약 목록/채팅방이 깨집니다.
# 순서: 코드 패치 먼저 적용 → 빌드 확인 → 커밋/푸시 → 이 스크립트로 마이그레이션 기록
# → SQL 실행 → 커밋/푸시.
#
# 사용법: all-blue-diving 리포지토리 루트에서 실행
#   chmod +x fix_batch98_bookings_payouts_select_lockdown.sh
#   ./fix_batch98_bookings_payouts_select_lockdown.sh
set -euo pipefail

if [ ! -d "supabase/migrations" ]; then
  echo "오류: all-blue-diving 리포지토리 루트에서 실행해야 합니다 (supabase/migrations 를 찾을 수 없음)."
  exit 1
fi

SRC_SQL="$(dirname "$0")/fix_bookings_payouts_select_lockdown.sql"
TARGET="supabase/migrations/migration_20260803_000000006"

if [ ! -f "$SRC_SQL" ]; then
  echo "오류: $SRC_SQL 를 찾을 수 없습니다. fix_bookings_payouts_select_lockdown.sql 을 같은 폴더에 두고 실행하세요."
  exit 1
fi

cp "$SRC_SQL" "$TARGET"

echo "1) 마이그레이션 파일 생성 완료: $TARGET"
echo ""
echo "*** 반드시 아래도 진행하세요 (이 파일을 커밋하는 것만으로는 DB가 바뀌지 않습니다) ***"
echo "  1. https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new 접속"
echo "  2. fix_bookings_payouts_select_lockdown.sql 파일 내용 전체 복사해서 붙여넣기 후 Run"
echo "  3. 맨 아래 정책 목록/bookings_directory/payouts_directory 조회 결과가 정상 나오는지 확인"
echo "  4. 사이트에서 로그인/내예약/채팅방(참가자목록)/강사 정산내역을 한 번씩 테스트"
echo ""
echo "완료되면:"
echo "  git add supabase/migrations/migration_20260803_000000006"
echo "  git commit -m 'security: bookings/payouts 조회(select) 잠금 (batch98)'"
echo "  git push"
echo ""
echo "문제가 생기면: fix_bookings_payouts_select_lockdown_rollback.sql 을 SQL Editor에서 실행해 즉시 되돌리세요."
