#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — 고객센터 접수(신고/1:1문의/분쟁조정) 침묵 유실 버그 수정
#
# 문제 1 (강사 신고 경로 없음): /support 페이지는 역할 제한이 없어 강사도 들어갈 수 있지만,
#   SupportTicketForm에 넘기는 userId가 항상 currentDiverId로 고정돼 있었다. 강사 계정은
#   currentDiverId가 빈 문자열이라, 강사가 다이버를 신고/문의/분쟁조정 접수해도 항상
#   user_id: "" 로 DB insert가 실패했다.
#
# 문제 2 (실패해도 성공으로 보임 — 더 심각함): addSupportTicket()이 insert 실패 시 에러
#   처리를 전혀 하지 않고 로컬 전용 가짜 티켓 객체로 조용히 대체했다. 화면은 항상
#   "접수되었습니다" 성공 토스트를 띄우지만 실제로는 DB에 아무것도 안 남는다. 이 함수는
#   신고/1:1문의/분쟁조정 세 가지가 전부 공유하므로, 원인이 무엇이든(권한, 네트워크 등)
#   접수 실패가 전부 사용자 눈에는 성공으로 보였다. addCenter()(관리자 센터 등록)에도
#   동일한 패턴이 있어 같이 고쳤다.
#
# 수정 내용 (3개 파일):
#   1) src/contexts/AppDataContext.tsx
#      - addSupportTicket: insert 실패 시 가짜 객체 반환 대신 에러를 throw (addBooking과
#        동일한 기존 패턴을 따름).
#      - addCenter: 동일한 이유로 동일하게 수정.
#   2) src/pages/SupportChat.tsx
#      - SupportTicketForm/MyInquiriesList에 넘기는 값을 currentDiverId 대신
#        profile?.id(로그인 계정 공통 id)로 변경 — 강사도 정상적으로 접수 가능해짐.
#        (관리자 큐 화면 SupportTicketQueue.tsx는 diverProfiles/instructorProfiles를
#        모두 조회해 "강사" 배지까지 이미 지원하고 있었음 — 프론트에서 잘못 연결한
#        배선 문제였을 뿐, 백엔드/관리자 쪽은 원래도 문제 없었음.)
#   3) src/components/support/SupportTicketForm.tsx
#      - handleSubmit에 try/catch 추가: addSupportTicket이 던진 에러를 잡아 실패
#        토스트를 보여준다(예전에는 실패해도 무조건 성공 토스트만 떴음).
#      - userId가 비어있으면(로그인 안 됨) 접수 전에 막고 안내.
#
# 사용법: all-blue-diving 리포지토리 루트에서 실행
#   chmod +x fix_apply_support_ticket.sh
#   ./fix_apply_support_ticket.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PATCH="$SCRIPT_DIR/fix_support_ticket.patch"

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

echo "패치 적용 완료:"
echo "  - src/contexts/AppDataContext.tsx"
echo "  - src/pages/SupportChat.tsx"
echo "  - src/components/support/SupportTicketForm.tsx"
echo ""
echo "다음 순서로 진행하세요:"
echo "  1. npm run build   (에러 없이 끝나는지 확인)"
echo "  2. git add src/contexts/AppDataContext.tsx src/pages/SupportChat.tsx src/components/support/SupportTicketForm.tsx"
echo "     git commit -m 'fix: 고객센터 접수(신고/문의/분쟁조정) 침묵 유실 버그 및 강사 신고 경로 누락 수정'"
echo "     git push"
echo ""
echo "되돌리려면(문제 발생 시): git apply rollback_support_ticket.patch"
