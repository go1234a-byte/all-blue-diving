#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — batch93: updateDiverProfile 에러 무시 문제 코드 수정 적용 (보너스)
#
# 증상: 마이페이지에서 생년월일/비상연락처/보험정보 등을 수정해도 실패할 경우
#   아무 에러도 콘솔에 남지 않아 원인 파악이 어려웠음 (updateDiverProfile 함수가
#   supabase 업데이트 결과의 error를 아예 읽지 않고 버렸음).
#
# 수정 내용: src/contexts/AppDataContext.tsx의 updateDiverProfile 함수에서
#   업데이트 결과의 error를 확인해 실패 시 콘솔에 로그를 남기도록 수정.
#
# 사용법: all-blue-diving 리포지토리 루트에서 실행
#   chmod +x fix_batch93_apply_diver_extra_fix.sh
#   ./fix_batch93_apply_diver_extra_fix.sh
set -euo pipefail

if [ ! -f "src/contexts/AppDataContext.tsx" ]; then
  echo "오류: all-blue-diving 리포지토리 루트에서 실행해야 합니다 (src/contexts/AppDataContext.tsx 를 찾을 수 없음)."
  exit 1
fi

PATCH_FILE="$(dirname "$0")/fix_batch93_diver_extra_error_log.patch"

if [ ! -f "$PATCH_FILE" ]; then
  echo "오류: $PATCH_FILE 를 찾을 수 없습니다. fix_batch93_diver_extra_error_log.patch 를 같은 폴더에 두고 실행하세요."
  exit 1
fi

if git apply --check "$PATCH_FILE" 2>/dev/null; then
  git apply "$PATCH_FILE"
  echo "패치 적용 완료: src/contexts/AppDataContext.tsx"
else
  echo "경고: 패치가 자동으로 적용되지 않습니다 (파일이 이미 수정되었거나 충돌 가능성)."
  echo "  git apply --check fix_batch93_diver_extra_error_log.patch 로 직접 확인해보세요."
  exit 1
fi

echo ""
echo "확인:"
echo "  npm run build"
echo ""
echo "완료되면 커밋 및 배포:"
echo "  git add src/contexts/AppDataContext.tsx"
echo "  git commit -m 'fix: updateDiverProfile 업데이트 실패 시 에러 로그 추가 (batch93)'"
echo "  git push   # Vercel 자동 재배포"
