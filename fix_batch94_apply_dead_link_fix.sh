#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — batch94: 마이페이지 "강사이신가요?" 죽은 링크 수정 적용
#
# 증상: 다이버 마이페이지 맨 아래 "강사이신가요? 마스터 테스트 툴바에서 '강사' 역할로
#   전환해보세요" 링크를 누르면 /instructor로 이동하는데, 그 "마스터 테스트 툴바"는
#   개발 전용(import.meta.env.DEV)이라 프로덕션엔 존재하지 않고, RequireRole 가드에
#   막혀 그냥 로그인 화면(/auth)으로 튕겨나감. 보안 문제는 아니고 QA용 문구가 프로덕션에
#   실수로 남아있던 것.
#
# 수정 내용: src/components/mypage/DiverMyPageView.tsx 맨 아래 링크를
#   실제로 강사 로그인/가입이 가능한 /auth로 바꾸고 문구도 수정.
#
# 사용법: all-blue-diving 리포지토리 루트에서 실행
#   chmod +x fix_batch94_apply_dead_link_fix.sh
#   ./fix_batch94_apply_dead_link_fix.sh
set -euo pipefail

if [ ! -f "src/components/mypage/DiverMyPageView.tsx" ]; then
  echo "오류: all-blue-diving 리포지토리 루트에서 실행해야 합니다 (src/components/mypage/DiverMyPageView.tsx 를 찾을 수 없음)."
  exit 1
fi

PATCH_FILE="$(dirname "$0")/fix_batch94_dead_instructor_link.patch"

if [ ! -f "$PATCH_FILE" ]; then
  echo "오류: $PATCH_FILE 를 찾을 수 없습니다. fix_batch94_dead_instructor_link.patch 를 같은 폴더에 두고 실행하세요."
  exit 1
fi

if git apply --check "$PATCH_FILE" 2>/dev/null; then
  git apply "$PATCH_FILE"
  echo "패치 적용 완료: src/components/mypage/DiverMyPageView.tsx"
else
  echo "경고: 패치가 자동으로 적용되지 않습니다 (파일이 이미 수정되었거나 충돌 가능성)."
  echo "  git apply --check fix_batch94_dead_instructor_link.patch 로 직접 확인해보세요."
  exit 1
fi

echo ""
echo "확인:"
echo "  npm run build"
echo ""
echo "완료되면 커밋 및 배포:"
echo "  git add src/components/mypage/DiverMyPageView.tsx"
echo "  git commit -m 'fix: 마이페이지 강사 전환 죽은 링크를 /auth로 수정 (batch94)'"
echo "  git push   # Vercel 자동 재배포"
