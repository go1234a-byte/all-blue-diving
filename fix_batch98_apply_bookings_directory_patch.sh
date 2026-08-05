#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — batch98: bookings/payouts 조회(select) 잠금에 맞춘 프론트엔드 코드 패치 적용
#
# 이 패치는 fix_bookings_payouts_select_lockdown.sql과 반드시 함께 적용해야 합니다.
# 순서: 이 스크립트로 코드 패치 적용 → 빌드 확인 → 커밋/푸시 → SQL 실행 → 마이그레이션
# 기록 스크립트 실행 → 커밋/푸시.
#
# 사용법: all-blue-diving 리포지토리 루트에서 실행
#   chmod +x fix_batch98_apply_bookings_directory_patch.sh
#   ./fix_batch98_apply_bookings_directory_patch.sh
set -euo pipefail

PATCH="$(dirname "$0")/fix_batch98_bookings_directory_frontend.patch"

if [ ! -f "$PATCH" ]; then
  echo "오류: $PATCH 를 찾을 수 없습니다. 같은 폴더에 두고 실행하세요."
  exit 1
fi

if [ ! -d "src/contexts" ]; then
  echo "오류: all-blue-diving 리포지토리 루트에서 실행해야 합니다 (src/contexts 를 찾을 수 없음)."
  exit 1
fi

git apply --check "$PATCH"
git apply "$PATCH"

echo "1) 코드 패치 적용 완료: src/contexts/AppDataContext.tsx"
echo ""
echo "다음 순서로 진행하세요:"
echo "  2. npm run build   (에러 없이 끝나는지 확인)"
echo "  3. git add src/contexts/AppDataContext.tsx"
echo "     git commit -m 'security: bookings/payouts 조회 잠금(batch98)에 맞춰 masked view로 전환'"
echo "     git push"
echo "  4. fix_batch98_bookings_payouts_select_lockdown.sh 실행 (마이그레이션 파일 기록)"
echo "  5. https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new 에서"
echo "     fix_bookings_payouts_select_lockdown.sql 전체 실행"
echo "  6. 사이트에서 로그인/내예약/채팅방(참가자목록)/강사 정산내역을 한 번씩 확인"
echo ""
echo "문제가 생기면: fix_bookings_payouts_select_lockdown_rollback.sql 을 SQL Editor에서 실행해 되돌리세요."
