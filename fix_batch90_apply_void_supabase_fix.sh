#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — batch90: "void supabase...update()" 무반응 버그 코드 수정 적용
#
# 증상 (사용자가 직접 겪은 문제):
#   최소 인원 미달로 투어가 "마감"되고 강사가 "그대로 진행"을 눌러도,
#   새로고침하거나 다시 로그인하면 똑같은 결정 패널이 다시 나타남
#   (마치 결정이 저장되지 않은 것처럼 반복됨).
#
# 원인: src/contexts/AppDataContext.tsx 안에서 DB 업데이트를
#   `void supabase.from(...).update(...).eq(...)` 형태로만 호출하고 있었음.
#   supabase-js의 쿼리 빌더는 "thenable"이라 .then()/await로 실제로 "소비"해야만
#   내부적으로 실제 HTTP 요청(PATCH)이 발생한다. `void`만 붙이고 끝내면
#   요청 자체가 전혀 나가지 않는다 — 화면(로컬 상태)만 "마감"으로 바뀌고
#   DB에는 전혀 반영되지 않아, 새로고침할 때마다 자동 마감 평가가 매번
#   다시 실행되어 같은 패널이 반복해서 나타났던 것.
#
# 이번에 같은 패턴으로 발견되어 함께 고친 보너스 버그:
#   관리자가 강사/다이버 계정에 "경고" 또는 "정지" 처리를 해도 DB에는
#   저장되지 않고 화면에만 반영되던 문제 (setProfileStatus 함수, 동일한 원인)
#
# 수정 내용: 총 3곳에서 `void supabase...` → `.then(({ error }) => {...})` 로 변경
#   1) 최소 인원 충족 시 투어 마감 처리
#   2) 최소 인원 미달 시 투어 마감 + 강사 결정 대기 처리
#   3) setProfileStatus (관리자 경고/정지 처리)
#
# 사용법: all-blue-diving 리포지토리 루트에서 실행
#   chmod +x fix_batch90_apply_void_supabase_fix.sh
#   ./fix_batch90_apply_void_supabase_fix.sh
set -euo pipefail

if [ ! -f "src/contexts/AppDataContext.tsx" ]; then
  echo "오류: all-blue-diving 리포지토리 루트에서 실행해야 합니다 (src/contexts/AppDataContext.tsx 를 찾을 수 없음)."
  exit 1
fi

PATCH_FILE="$(dirname "$0")/fix_batch90_void_supabase_bug.patch"

if [ ! -f "$PATCH_FILE" ]; then
  echo "오류: $PATCH_FILE 를 찾을 수 없습니다. fix_batch90_void_supabase_bug.patch 를 같은 폴더에 두고 실행하세요."
  exit 1
fi

git apply --check "$PATCH_FILE" 2>/dev/null && APPLY_OK=1 || APPLY_OK=0

if [ "$APPLY_OK" = "1" ]; then
  git apply "$PATCH_FILE"
  echo "패치 적용 완료: src/contexts/AppDataContext.tsx"
else
  echo "경고: 패치가 자동으로 적용되지 않습니다 (파일이 이미 수정되었거나 충돌 가능성)."
  echo "  git apply --check fix_batch90_void_supabase_bug.patch 로 직접 확인해보세요."
  exit 1
fi

echo ""
echo "확인:"
echo "  npm run build"
echo ""
echo "완료되면 커밋 및 배포:"
echo "  git add src/contexts/AppDataContext.tsx"
echo "  git commit -m 'fix: void supabase 업데이트가 실제로 실행되지 않던 버그 수정 (batch90)'"
echo "  git push   # Vercel 자동 재배포"
