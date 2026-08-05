#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — 투어 상세 페이지(TourDetail.tsx)의 authLoading 깜빡임 수정
#
# 원인: MyBookings/SupportChat/ChatList/ChatRoom과 같은 종류의 문제입니다. 로그인 직후
#   session -> profiles 조회가 끝나기 전까지는 currentDiverId/currentInstructorId가
#   아직 비어있어서, 이미 예약한 투어의 상세 페이지를 열면 "예약하기" 버튼이 잠깐 잘못
#   보이거나(이미 예약했는데도), 담당 강사 본인이 자기 투어 상세를 봐도 강사 전용 버튼이
#   잠깐 안 보입니다. DB/보안 문제는 아니고 순수 화면 렌더링 타이밍 문제입니다.
#
# 수정: 다른 페이지들과 동일하게 "인증 정보를 확인하는 중..." 로딩 상태를 추가해서,
#   authLoading이 끝날 때까지는 예약 여부/강사 여부를 판단하지 않습니다.
#
# 사용법: all-blue-diving 리포지토리 루트에서 실행
#   chmod +x fix_apply_tourdetail_authloading_flash.sh
#   ./fix_apply_tourdetail_authloading_flash.sh
set -euo pipefail

PATCH="$(dirname "$0")/fix_tourdetail_authloading_flash.patch"

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

echo "1) 코드 패치 적용 완료: src/pages/TourDetail.tsx"
echo ""
echo "다음 순서로 진행하세요:"
echo "  2. npm run build   (에러 없이 끝나는지 확인)"
echo "  3. git add src/pages/TourDetail.tsx"
echo "     git commit -m 'fix: 투어 상세 페이지에서 로그인 직후 예약/강사 버튼이 잠깐 잘못 표시되던 문제 수정'"
echo "     git push"
echo ""
echo "DB 변경은 없어서 SQL 실행은 필요 없습니다."
