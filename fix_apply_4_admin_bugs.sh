#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — 2026-08-05 QA 감사에서 발견된 4개 신규 버그 수정 적용
#
# 수정 내용:
#   1) 강사 지원서 반려 기능 부재 — InstructorApplicationQueue에 반려 버튼+사유 다이얼로그
#      추가, instructors 테이블 realtime 구독 추가(승인/반려가 강사 세션에 즉시 반영).
#   2) 관리자/강사 알림이 DB에 저장되지 않던 문제 — instructor_notifications 테이블 신설,
#      fetch+realtime 구독으로 전환(새로고침/다른 세션에서도 알림 유지).
#   3) 센터(다이빙샵) 승인 개념이 스키마에 없던 문제 — centers.status 컬럼 추가, 관리자
#      승인/반려 UI 추가, 미승인 센터는 다른 강사의 "기존 센터 선택" 목록에서 숨김.
#   4) 패널티 이력 조회/정정 불가 문제 — 강사별 누적 이력 보기 UI 추가, 오적용된 특정
#      건만 정정(취소)하는 기능 추가(penalties_log.voided).
#
# 변경 파일 (12개):
#   src/types/index.ts
#   src/contexts/AppDataContext.tsx
#   src/lib/adminAnalytics.ts
#   src/components/mypage/InstructorApplicationQueue.tsx
#   src/components/instructor/CenterFormSection.tsx
#   src/components/instructor/InstructorNotificationCenter.tsx
#   src/components/admin/dashboard/CenterApprovalPanel.tsx
#   src/components/admin/dashboard/InstructorVerificationPanel.tsx
#   src/components/admin/dashboard/PenaltyWarningPanel.tsx
#   src/pages/admin/AdminCentersPage.tsx
#   src/pages/admin/AdminInstructorsPage.tsx
#   src/pages/admin/AdminNotificationsPage.tsx
#
# ※ 이 스크립트는 프론트엔드 패치만 적용합니다. SQL(fix_4_admin_bugs.sql)은 반드시
#   별도로 Supabase 대시보드에서 먼저 실행해야 합니다 — SQL을 먼저 적용하지 않고 이
#   패치만 배포하면 새 컬럼/테이블이 없어 관련 화면이 에러를 내거나 조용히 실패합니다.
#
# 적용 순서:
#   1. https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new 에서
#      fix_4_admin_bugs.sql 전체 내용을 붙여넣고 실행
#      (fix_rls_write_lockdown.sql을 아직 적용 안 했다면 그것부터 먼저 적용해야 합니다)
#   2. all-blue-diving 리포지토리 루트에서:
#        chmod +x fix_apply_4_admin_bugs.sh
#        ./fix_apply_4_admin_bugs.sh
#   3. npm run build   (에러 없이 끝나는지 확인)
#   4. git add -A
#      git commit -m 'fix: 강사 지원서 반려/알림 DB 영속화/센터 승인 워크플로우/패널티 이력 정정 추가'
#      git push
#   5. 확인: 관리자 계정으로 (a) 대기중인 강사 반려 처리, (b) 새로고침 후 알림센터에
#      알림이 유지되는지, (c) 신규 센터가 "승인 대기"로 뜨는지, (d) 패널티 이력 보기+정정이
#      되는지 각각 눌러서 확인하세요.
#
# 되돌리려면(문제 발생 시):
#   프론트엔드: git apply rollback_4_admin_bugs.patch
#   DB: fix_4_admin_bugs_rollback.sql 실행 (주의: instructor_notifications 테이블을
#       삭제하므로 실제 쌓인 알림 이력이 있다면 먼저 백업할 것)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PATCH="$SCRIPT_DIR/fix_4_admin_bugs.patch"

if [ ! -f "$PATCH" ]; then
  echo "오류: $PATCH 를 찾을 수 없습니다. 같은 폴더에 두고 실행하세요."
  exit 1
fi
if [ ! -d "src/pages" ]; then
  echo "오류: all-blue-diving 리포지토리 루트에서 실행해야 합니다 (src/pages 를 찾을 수 없음)."
  exit 1
fi

echo "※ SQL(fix_4_admin_bugs.sql)을 Supabase에 먼저 적용했는지 확인하세요."
echo "  아직이라면 Ctrl+C로 중단하고 SQL부터 적용한 뒤 다시 실행하세요."
echo ""

git apply --check "$PATCH"
git apply "$PATCH"

echo "패치 적용 완료 (12개 파일)."
echo ""
echo "다음 순서로 진행하세요:"
echo "  1. npm run build"
echo "  2. git add -A"
echo "     git commit -m 'fix: 강사 지원서 반려/알림 DB 영속화/센터 승인 워크플로우/패널티 이력 정정 추가'"
echo "     git push"
