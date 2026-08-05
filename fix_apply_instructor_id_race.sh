#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — 강사가 자기 투어 수정 화면에서 강제로 튕겨나가는 버그 수정
#
# 발견 경위: 강사 계정으로 로그인해서 강사 콘솔을 직접 확인하던 중, "투어 수정" 페이지
#   URL로 직접 들어가면(또는 새로고침하면) 본인이 만든 투어인데도 강사 콘솔로 즉시
#   튕겨나가는 것을 재현했습니다.
#
# 원인: RoleContext에는 두 단계의 강사 식별자 조회가 있습니다.
#   1) profiles 테이블 조회 (auth 계정 ↔ 프로필) — 끝나면 authLoading = false
#   2) instructors 테이블 조회 (profiles.id → 실제 강사 PK인 instructors.id) — 별도 useEffect로
#      뒤늦게 끝남
#   기존 코드는 1)번만 끝나면 authLoading을 false로 내렸는데, TourEditPage의 "본인 소유
#   투어인지" 확인 로직(tour.instructorId !== currentInstructorId)은 RequireRole이
#   authLoading만 보고 통과시켜버린 시점에는 아직 2)번이 안 끝나 currentInstructorId가
#   빈 문자열입니다. 빈 문자열은 실제 투어 소유자 ID와 절대 같을 수 없으므로, 진짜 담당
#   강사인데도 "남의 투어"로 오인해 <Navigate to="/instructor" />로 즉시 튕겨나갑니다.
#   MyPage 등에서 고친 "잠깐 잘못 보였다가 정상으로 바뀌는" 화면 깜빡임과 달리, 이건
#   Navigate가 페이지 자체를 이동시켜버려서 저절로 복구되지 않는 더 심각한 버전입니다.
#
# 수정: authLoading을 내리기 전에, 강사 계정이면 instructors.id 조회까지 같이 기다리도록
#   RoleContext.tsx의 프로필 로딩 로직 한 곳만 고쳤습니다. RequireRole/TourEditPage 등
#   기존 소비 코드는 전혀 손대지 않아도 됩니다(이미 다들 authLoading을 올바르게 기다리고
#   있었고, authLoading 자체가 더 늦게 꺼지도록만 바뀝니다).
#
# 사용법: all-blue-diving 리포지토리 루트에서 실행
#   chmod +x fix_apply_instructor_id_race.sh
#   ./fix_apply_instructor_id_race.sh
set -euo pipefail

PATCH="$(dirname "$0")/fix_instructor_id_race.patch"

if [ ! -f "$PATCH" ]; then
  echo "오류: $PATCH 를 찾을 수 없습니다. 같은 폴더에 두고 실행하세요."
  exit 1
fi

if [ ! -d "src/contexts" ]; then
  echo "오류: all-blue-diving 리포지토리 루트에서 실행해야 합니다 (src/contexts 를 찾을 수 없음)."
  exit 1
fi

git apply --check "$PATCH"
git apply "$PATCH"

echo "1) 코드 패치 적용 완료: src/contexts/RoleContext.tsx"
echo ""
echo "다음 순서로 진행하세요:"
echo "  2. npm run build   (에러 없이 끝나는지 확인)"
echo "  3. git add src/contexts/RoleContext.tsx"
echo "     git commit -m 'fix: 강사가 본인 투어 수정 화면에서 강제로 튕겨나가던 문제 수정'"
echo "     git push"
echo ""
echo "DB 변경은 없어서 SQL 실행은 필요 없습니다."
