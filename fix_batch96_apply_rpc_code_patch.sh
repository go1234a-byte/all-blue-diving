#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — batch96: RLS 보안 강화에 맞춰 코드에서 RPC 호출로 전환
#
# fix_rls_write_lockdown.sql을 적용하면 tours/reviews/coupons/deleted_accounts에 대한
# 일반 update가 소유자/관리자만 가능하도록 막힙니다. 그런데 아래 4개 기능은 원래
# "소유자가 아닌 사람"이 특정 필드 하나만 안전하게 바꿔야 하는 경우라, SQL 쪽에 안전한
# 전용 함수(RPC)를 만들어뒀습니다. 이 패치는 프론트엔드가 그 RPC를 쓰도록 바꿉니다.
#   1. 투어 자동마감 처리 (누구 화면에서 열든 트리거될 수 있음) → apply_tour_auto_close()
#   2. 리뷰 "신고" 버튼 (신고자가 작성자가 아님) → report_review()
#   3. 쿠폰 사용횟수 증가 (구매자가 쿠폰 소유자가 아님) → redeem_coupon()
#   4. 탈퇴 후 재가입 제한 확인 (로그인 전에 확인해야 함) → is_recently_deleted_account()
#
# *** 이 코드 패치는 fix_batch96_rls_write_lockdown.sh(SQL)와 반드시 함께 적용해야
#     합니다. 코드만 바꾸고 SQL을 안 하면 RPC 함수가 없어서 에러가 나고, SQL만 하고
#     코드를 안 바꾸면 위 4개 기능이 깨집니다. ***
#
# 사용법: all-blue-diving 리포지토리 루트에서 실행
#   chmod +x fix_batch96_apply_rpc_code_patch.sh
#   ./fix_batch96_apply_rpc_code_patch.sh
set -euo pipefail

if [ ! -f "src/contexts/AppDataContext.tsx" ]; then
  echo "오류: all-blue-diving 리포지토리 루트에서 실행해야 합니다."
  exit 1
fi

PATCH_FILE="$(dirname "$0")/fix_batch96_rls_rpc_migration.patch"

if [ ! -f "$PATCH_FILE" ]; then
  echo "오류: $PATCH_FILE 를 찾을 수 없습니다. 같은 폴더에 두고 실행하세요."
  exit 1
fi

if git apply --check "$PATCH_FILE" 2>/dev/null; then
  git apply "$PATCH_FILE"
  echo "패치 적용 완료: AppDataContext.tsx, DiverSignupForm.tsx, InstructorSignupForm.tsx"
else
  echo "경고: 패치가 자동으로 적용되지 않습니다 (파일이 이미 수정되었거나 충돌 가능성)."
  echo "  git apply --check fix_batch96_rls_rpc_migration.patch 로 직접 확인해보세요."
  exit 1
fi

echo ""
echo "확인:"
echo "  npm run build"
echo ""
echo "완료되면 커밋 및 배포:"
echo "  git add src/contexts/AppDataContext.tsx src/components/auth/DiverSignupForm.tsx src/components/auth/InstructorSignupForm.tsx"
echo "  git commit -m 'security: RLS 강화에 맞춰 자동마감/리뷰신고/쿠폰사용/재가입확인을 안전한 RPC 호출로 전환 (batch96)'"
echo "  git push"
echo ""
echo "*** 이 커밋을 push한 뒤, fix_batch96_rls_write_lockdown.sh로 SQL 마이그레이션도 반드시 적용하세요. ***"
