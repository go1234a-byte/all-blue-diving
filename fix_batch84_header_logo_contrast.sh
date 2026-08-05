#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — batch84: 헤더의 "ALL BLUE" 로고 워드마크가 배경과 겹쳐 안 보이는 문제 수정
# 원인: src/components/layout/AppHeader.tsx 가 title이 없을 때(투어 홈 등 하단 네비 대부분 화면)
#       <Logo size="sm" /> 를 tone 지정 없이 렌더링함. Logo 컴포넌트는 tone="default"일 때
#       워드마크 색을 text-primary(파란 글자)로 쓰는데, 헤더 배경은 항상 bg-gradient-ocean
#       (파란 그라데이션)이라 파란 글자가 파란 배경 위에서 거의 안 보임.
#       batch82에서 고친 title 텍스트 대비 문제와 동일 계열 버그가 로고에도 있었던 것.
# 수정: 헤더의 Logo에 tone="inverted"를 지정해 흰색 워드마크를 사용하도록 변경.
#       (AdminSidebar.tsx의 Logo는 밝은 배경(.admin-light) 위에 있어 그대로 둠)
#
# 사용법: all-blue-diving 리포지토리 루트에서 실행
#   chmod +x fix_batch84_header_logo_contrast.sh
#   ./fix_batch84_header_logo_contrast.sh
set -euo pipefail

TARGET="src/components/layout/AppHeader.tsx"

if [ ! -f "$TARGET" ]; then
  echo "오류: all-blue-diving 리포지토리 루트에서 실행해야 합니다 ($TARGET 를 찾을 수 없음)."
  exit 1
fi

if grep -q '<Logo size="sm" tone="inverted" />' "$TARGET"; then
  echo "이미 수정되어 있습니다. 변경 없이 종료합니다."
  exit 0
fi

if ! grep -q '<Logo size="sm" />' "$TARGET"; then
  echo "경고: 예상한 텍스트를 찾지 못했습니다. AppHeader.tsx를 수동으로 확인하세요."
  echo '  <Logo size="sm" /> 를 <Logo size="sm" tone="inverted" /> 로 바꿔주세요.'
  exit 1
fi

echo "1) 백업 -> ${TARGET}.bak"
cp "$TARGET" "${TARGET}.bak"

echo "2) 헤더 로고 워드마크 색상 수정 (tone=\"inverted\" 추가)"
sed -i.tmp 's/<Logo size="sm" \/>/<Logo size="sm" tone="inverted" \/>/' "$TARGET"
rm -f "${TARGET}.tmp"

grep -n "<Logo" "$TARGET"

echo ""
echo "3) 검증 실행"
npx tsc --noEmit
npm run lint
npm run build

echo ""
echo "완료. 문제 없으면:"
echo "  git add src/components/layout/AppHeader.tsx"
echo "  git commit -m 'fix: 헤더 로고 워드마크가 배경 그라데이션과 겹치는 대비 문제 수정 (batch84)'"
echo "  git push"
echo ""
echo "백업 파일(.bak)은 확인 후 삭제해도 됩니다."
