#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — MyPage에 이어, 같은 종류의 "로그인 직후 잠깐 잘못 표시" 버그를
# 다른 4개 페이지에서도 수정
#
# 원인(4개 파일 공통): RequireRole로 보호되지 않는 페이지들이 RoleContext의 authLoading을
#   기다리지 않고 바로 렌더링해서, 로그인/가입 직후 role="public"·currentDiverId=""로
#   남아있는 짧은 순간에 실제로는 데이터가 있는데도 "없음" 상태가 잠깐 표시됩니다.
#   - MyBookings.tsx: "예약 내역 없음"이 잠깐 잘못 표시
#   - SupportChat.tsx: "내 문의 보기" 등이 잠깐 비어보임
#   - ChatList.tsx: "채팅방 없음"이 잠깐 잘못 표시
#   - ChatRoom.tsx: 담당 강사 본인인데도 참가자 실명이 잠깐 마스킹되어 보임
#   DB/보안 문제는 아니고 순수 화면 렌더링 타이밍 문제입니다.
#
# 수정: RequireRole/MyPage와 동일한 "인증 정보를 확인하는 중..." 로딩 상태를 4곳 모두에
#   추가해서, authLoading이 끝날 때까지는 실제 데이터 유무를 판단하지 않습니다.
#
# 사용법: all-blue-diving 리포지토리 루트에서 실행
#   chmod +x fix_apply_authloading_flash.sh
#   ./fix_apply_authloading_flash.sh
set -euo pipefail

PATCH="$(dirname "$0")/fix_authloading_flash.patch"

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

echo "1) 코드 패치 적용 완료: MyBookings.tsx, SupportChat.tsx, ChatList.tsx, ChatRoom.tsx"
echo ""
echo "다음 순서로 진행하세요:"
echo "  2. npm run build   (에러 없이 끝나는지 확인)"
echo "  3. git add src/pages/MyBookings.tsx src/pages/SupportChat.tsx src/pages/ChatList.tsx src/pages/ChatRoom.tsx"
echo "     git commit -m 'fix: 로그인 직후 예약/문의/채팅 화면에서 잠깐 잘못 표시되던 문제 수정'"
echo "     git push"
echo ""
echo "DB 변경은 없어서 SQL 실행은 필요 없습니다."
