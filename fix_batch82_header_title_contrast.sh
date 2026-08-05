#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — batch82: 상단 헤더 타이틀 텍스트가 배경 그라데이션과 겹쳐 보이는 문제 수정
# 원인: src/components/layout/AppHeader.tsx 가 title 텍스트에 text-primary(파란 글자)를 쓰는데
#       헤더 배경도 bg-gradient-ocean(파란 그라데이션)이라, batch81에서 primary를 더 어둡게
#       낮추면서 글자색과 배경 시작색이 거의 같은 톤이 되어 버림.
#       마이페이지/예약내역/즐겨찾기/채팅목록/강사 대시보드 등 AppHeader에 title을 넘기는
#       모든 화면에 공통으로 영향을 줌.
# 수정: 제목 텍스트를 text-primary -> text-primary-foreground(흰색 계열)로 변경.
#
# 사용법: all-blue-diving 리포지토리 루트에서 실행
#   chmod +x fix_batch82_header_title_contrast.sh
#   ./fix_batch82_header_title_contrast.sh
set -euo pipefail

TARGET="src/components/layout/AppHeader.tsx"

if [ ! -f "$TARGET" ]; then
  echo "오류: all-blue-diving 리포지토리 루트에서 실행해야 합니다 ($TARGET 를 찾을 수 없음)."
  exit 1
fi

if ! grep -q 'text-base font-bold tracking-tight text-primary"' "$TARGET"; then
  if grep -q 'text-base font-bold tracking-tight text-primary-foreground"' "$TARGET"; then
    echo "이미 수정되어 있습니다. 변경 없이 종료합니다."
    exit 0
  fi
  echo "경고: 예상한 텍스트를 찾지 못했습니다. AppHeader.tsx를 수동으로 확인하세요."
  echo "  <span className=\"text-base font-bold tracking-tight text-primary\">{title}</span>"
  echo "  위 줄의 text-primary 를 text-primary-foreground 로 바꿔주세요."
  exit 1
fi

echo "1) 백업 -> ${TARGET}.bak"
cp "$TARGET" "${TARGET}.bak"

echo "2) 헤더 타이틀 텍스트 색상 수정 (text-primary -> text-primary-foreground)"
sed -i.tmp 's/text-base font-bold tracking-tight text-primary"/text-base font-bold tracking-tight text-primary-foreground"/' "$TARGET"
rm -f "${TARGET}.tmp"

grep -n "text-base font-bold" "$TARGET"

echo ""
echo "3) 검증 실행"
npx tsc --noEmit
npm run lint
npm run build

echo ""
echo "완료. 문제 없으면:"
echo "  git add src/components/layout/AppHeader.tsx"
echo "  git commit -m 'fix: 헤더 타이틀 텍스트가 배경 그라데이션과 겹치는 대비 문제 수정 (batch82)'"
echo "  git push"
echo ""
echo "백업 파일(.bak)은 확인 후 삭제해도 됩니다."
