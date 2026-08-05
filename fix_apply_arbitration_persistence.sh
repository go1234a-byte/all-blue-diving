#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — 강사↔최고관리자 비밀 중재방(arbitration) DB 영속화 적용
#
# 문제: addArbitrationMessage()가 Supabase 호출 없이 프론트엔드 메모리에만 메시지를
#   쌓고 있었다. arbitration_messages 백엔드 테이블 자체가 없어 새로고침/다른 세션에서
#   대화가 전혀 보이지 않았다 — 강사와 관리자가 이 방에서 실제로 대화를 나눌 수 없었다.
#   화면 배너의 "대화록은 관련 규정에 의거하여 보관됩니다"는 실제와 다른 허위 표시였다.
#   증빙 첨부도 파일명만 저장되고 실제 파일은 어디에도 업로드되지 않았다.
#
# 수정 내용:
#   1) fix_arbitration_messages_persistence.sql — arbitration_messages 테이블 신규
#      생성 + RLS(관리자 전체, 강사는 본인 방만) + realtime 구독 등록.
#   2) fix_arbitration_persistence.patch — 프론트엔드 3개 파일:
#      - src/types/index.ts: ArbitrationMessage에 attachmentUrls 추가
#      - src/contexts/AppDataContext.tsx: arbitration_messages 초기 로드 + realtime
#        구독 추가, addArbitrationMessage를 실제 DB insert로 전환(실패 시 에러 throw)
#      - src/components/arbitration/ArbitrationChatRoom.tsx: 전송/첨부를 async로 바꿔
#        실패 시 에러 토스트 표시, 첨부 이미지를 실제로 Storage에 업로드하고 클릭 가능한
#        링크로 렌더링
#
# ※ 이 스크립트는 프론트엔드 패치만 적용합니다. SQL은 반드시 별도로 Supabase
#   대시보드에서 직접 실행해야 합니다(아래 순서 참고). SQL을 먼저 적용하지 않고 이
#   패치만 배포하면 화면이 빈 대화방으로 보이거나(테이블 없음) 조회/전송이 실패합니다
#   — 반드시 SQL을 먼저 적용한 뒤 프론트엔드를 배포하세요.
#
# 적용 순서:
#   1. https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new 에서
#      fix_arbitration_messages_persistence.sql 전체 내용을 붙여넣고 실행
#      (fix_rls_write_lockdown.sql을 아직 적용 안 했다면 그것부터 먼저 적용해야 합니다 —
#       is_admin()/owns_instructor() 헬퍼 함수가 필요합니다)
#   2. all-blue-diving 리포지토리 루트에서:
#        chmod +x fix_apply_arbitration_persistence.sh
#        ./fix_apply_arbitration_persistence.sh
#   3. npm run build   (에러 없이 끝나는지 확인)
#   4. git add src/types/index.ts src/contexts/AppDataContext.tsx src/components/arbitration/ArbitrationChatRoom.tsx
#      git commit -m 'fix: 중재방 메시지 DB 영속화 및 증빙 파일 실제 업로드'
#      git push
#   5. 강사 계정 + 관리자 계정으로 각각 로그인해 같은 중재방에서 메시지를 주고받아
#      실제로 서로에게 보이는지, 새로고침해도 유지되는지 확인하세요.
#
# 되돌리려면(문제 발생 시):
#   프론트엔드: git apply rollback_arbitration_persistence.patch
#   DB: fix_arbitration_messages_persistence_rollback.sql 실행 (주의: 테이블을 삭제하므로
#       실제 주고받은 대화가 있다면 먼저 백업할 것)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PATCH="$SCRIPT_DIR/fix_arbitration_persistence.patch"

if [ ! -f "$PATCH" ]; then
  echo "오류: $PATCH 를 찾을 수 없습니다. 같은 폴더에 두고 실행하세요."
  exit 1
fi
if [ ! -d "src/pages" ]; then
  echo "오류: all-blue-diving 리포지토리 루트에서 실행해야 합니다 (src/pages 를 찾을 수 없음)."
  exit 1
fi

echo "※ SQL(fix_arbitration_messages_persistence.sql)을 Supabase에 먼저 적용했는지 확인하세요."
echo "  아직이라면 Ctrl+C로 중단하고 SQL부터 적용한 뒤 다시 실행하세요."
echo ""

git apply --check "$PATCH"
git apply "$PATCH"

echo "패치 적용 완료:"
echo "  - src/types/index.ts"
echo "  - src/contexts/AppDataContext.tsx"
echo "  - src/components/arbitration/ArbitrationChatRoom.tsx"
echo ""
echo "다음 순서로 진행하세요:"
echo "  1. npm run build"
echo "  2. git add src/types/index.ts src/contexts/AppDataContext.tsx src/components/arbitration/ArbitrationChatRoom.tsx"
echo "     git commit -m 'fix: 중재방 메시지 DB 영속화 및 증빙 파일 실제 업로드'"
echo "     git push"
