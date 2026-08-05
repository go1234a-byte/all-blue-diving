#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — 마이페이지 "게스트 다이버" 잠깐 잘못 표시되는 버그 수정
#
# 원인: 가입/로그인 직후 auth 세션은 바로 잡히지만, 그 세션에 연결된 profiles 행을
#   비동기로 다시 조회하는 동안(RoleContext의 authLoading=true 구간) MyPage.tsx가
#   이를 기다리지 않고 바로 화면을 그려서, 실제로는 로그인된 다이버인데도 잠깐
#   "게스트 다이버"로 보였다가 정상 이름으로 바뀝니다. DB/보안 문제는 아니고 순수
#   화면 렌더링 타이밍 문제입니다.
#
# 수정: RequireRole 가드와 동일한 "인증 정보를 확인하는 중..." 로딩 상태를
#   MyPage.tsx에도 추가해서, authLoading이 끝날 때까지는 아무 프로필도 안 보여줍니다.
#   (진짜 비로그인 게스트는 authLoading이 금방 false가 되므로 영향 없음)
#
# 사용법: all-blue-diving 리포지토리 루트에서 실행
#   chmod +x fix_apply_mypage_guest_flash.sh
#   ./fix_apply_mypage_guest_flash.sh
set -euo pipefail

PATCH="$(dirname "$0")/fix_mypage_guest_flash.patch"

if [ ! -f "$PATCH" ]; then
  echo "오류: $PATCH 를 찾을 수 없습니다. 같은 폴더에 두고 실행하세요."
  exit 1
fi

if [ ! -d "src/pages" ]; then
  echo "오류: all-blue-diving 리포지토리 루트에서 실행해야 합니다 (src/pages 를 찾을 수 없음)."
  exit 1
fi

git apply --check "$PATCH"
git apply "$PATCH"

echo "1) 코드 패치 적용 완료: src/pages/MyPage.tsx"
echo ""
echo "다음 순서로 진행하세요:"
echo "  2. npm run build   (에러 없이 끝나는지 확인)"
echo "  3. git add src/pages/MyPage.tsx"
echo "     git commit -m 'fix: 마이페이지에서 로그인 직후 게스트 다이버로 잠깐 잘못 표시되던 문제 수정'"
echo "     git push"
echo ""
echo "DB 변경은 없어서 SQL 실행은 필요 없습니다."
