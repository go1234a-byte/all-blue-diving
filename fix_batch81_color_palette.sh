#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — batch81: 색상 팔레트 교체 (절제된 딥오션 팔레트)
# 사용법: 이 파일을 all-blue-diving 리포지토리 루트에 두고 실행
#   chmod +x fix_batch81_color_palette.sh
#   ./fix_batch81_color_palette.sh
set -euo pipefail

if [ ! -f "src/index.css" ] || [ ! -f "src/lib/activityBadge.ts" ]; then
  echo "오류: all-blue-diving 리포지토리 루트에서 실행해야 합니다 (src/index.css 를 찾을 수 없음)."
  exit 1
fi

echo "1) src/index.css 백업 -> src/index.css.bak"
cp src/index.css src/index.css.bak
cp src/lib/activityBadge.ts src/lib/activityBadge.ts.bak

echo "2) src/index.css :root 블록 교체"
python3 - "$PWD/src/index.css" <<'PYEOF'
import re, sys

path = sys.argv[1]
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

new_root = """  :root {
    /* ALL BLUE — 절제된 딥오션 팔레트: 네이비/블루/틸 모노크롬, 코랄 제거 */
    --background: 212 65% 11%;
    --foreground: 200 30% 95%;

    --card: 212 55% 14%;
    --card-foreground: 200 30% 95%;

    --popover: 212 55% 14%;
    --popover-foreground: 200 30% 95%;

    /* ALL BLUE brand primary: 차분한 블루 (#0D47A1) */
    --primary: 216 85% 34%;
    --primary-foreground: 0 0% 100%;
    --primary-glow: 216 80% 50%;

    --secondary: 212 45% 16%;
    --secondary-foreground: 200 30% 94%;

    --muted: 212 40% 15%;
    --muted-foreground: 200 15% 68%;

    /* 톤 다운 틸 액센트 (#1AB6C6) — CTA, 스쿠버 뱃지, 포커스링 */
    --accent: 186 77% 44%;
    --accent-foreground: 0 0% 100%;

    --destructive: 0 78% 58%;
    --destructive-foreground: 0 0% 100%;

    --warning: 38 92% 55%;
    --warning-foreground: 26 40% 14%;

    --success: 152 55% 46%;
    --success-foreground: 0 0% 100%;

    /* 코랄 제거 → 슬레이트 그레이 (#333F52) — 프리다이빙 뱃지 */
    --coral: 217 23% 26%;
    --coral-foreground: 210 20% 92%;

    --border: 212 32% 20%;
    --input: 212 32% 20%;
    --ring: 186 77% 44%;

    --radius: 1rem;

    --sidebar-background: 212 65% 6%;
    --sidebar-foreground: 200 30% 92%;
    --sidebar-primary: 186 77% 44%;
    --sidebar-primary-foreground: 212 65% 6%;
    --sidebar-accent: 212 45% 16%;
    --sidebar-accent-foreground: 200 30% 92%;
    --sidebar-border: 212 32% 20%;
    --sidebar-ring: 186 77% 44%;

    /* ALL BLUE ocean gradients & shadows — 모노크롬 블루로 재계산 (색 섞임 제거) */
    --gradient-ocean: linear-gradient(160deg, hsl(216 85% 40%) 0%, hsl(214 55% 20%) 45%, hsl(212 65% 11%) 100%);
    --gradient-ocean-light: linear-gradient(135deg, hsl(216 85% 48%) 0%, hsl(216 85% 30%) 100%);
    /* 소비자 앱 페이지 배경 그라데이션 — 거의 모든 화면(Search/Checkout/MyPage/TourDetail 등)이
       이 토큰 하나로 페이지 배경을 그린다. 관리자는 .admin-light 스코프에서 밝은 값으로 되돌린다. */
    --gradient-surface: linear-gradient(180deg, hsl(212 65% 11%) 0%, hsl(212 60% 8%) 100%);
    --shadow-ocean: 0 20px 50px -15px hsl(212 65% 4% / 0.5);
    --shadow-ocean-glow: 0 0 40px hsl(186 77% 44% / 0.35);
  }"""

new_admin_light = """  .admin-light {
    --background: 216 33% 97%;
    --foreground: 212 55% 10%;
    --card: 0 0% 100%;
    --card-foreground: 212 55% 10%;
    --popover: 0 0% 100%;
    --popover-foreground: 212 55% 10%;
    --secondary: 216 20% 94%;
    --secondary-foreground: 212 40% 14%;
    --muted: 216 18% 95%;
    --muted-foreground: 217 15% 40%;
    --border: 216 20% 89%;
    --input: 216 20% 89%;
    --gradient-surface: linear-gradient(180deg, hsl(216 33% 97%) 0%, hsl(216 20% 94%) 100%);
  }"""

root_pattern = re.compile(r"  :root \{.*?\n  \}", re.DOTALL)
admin_pattern = re.compile(r"  \.admin-light \{.*?\n  \}", re.DOTALL)

content, n1 = root_pattern.subn(new_root, content, count=1)
content, n2 = admin_pattern.subn(new_admin_light, content, count=1)

if n1 != 1 or n2 != 1:
    print(f"경고: :root 치환 {n1}건, .admin-light 치환 {n2}건 (각각 1건이어야 정상). 파일 구조가 변경되었을 수 있으니 index.css.bak과 비교해 수동 확인하세요.")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("index.css 업데이트 완료")
PYEOF

echo "3) src/lib/activityBadge.ts 주석 업데이트"
python3 - "$PWD/src/lib/activityBadge.ts" <<'PYEOF'
import sys

path = sys.argv[1]
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_comment = """/**
 * 액티비티 타입별 뱃지 색상 — 한눈에 구별되도록 타입마다 다른 색을 사용한다.
 * scuba: 아쿠아(accent) · freediving: 코랄 · liveaboard: 골드(warning)
 * 세 색 모두 기존 디자인 토큰(index.css)을 그대로 재사용한다.
 */"""

new_comment = """/**
 * 액티비티 타입별 뱃지 색상 — 한눈에 구별되도록 타입마다 다른 색을 사용한다.
 * scuba: 틸(accent) · freediving: 슬레이트 그레이(coral 토큰 재사용) · liveaboard: 골드(warning)
 * 세 색 모두 기존 디자인 토큰(index.css)을 그대로 재사용한다.
 */"""

if old_comment not in content:
    print("경고: 기존 주석 텍스트를 찾지 못했습니다. activityBadge.ts를 수동으로 확인하세요 (클래스명 자체는 변경 불필요).")
else:
    content = content.replace(old_comment, new_comment)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("activityBadge.ts 주석 업데이트 완료 (클래스명 bg-coral/bg-accent/bg-warning은 그대로 유지)")
PYEOF

echo ""
echo "4) 검증 실행"
npx tsc --noEmit
npm run lint
npm run build

echo ""
echo "완료. 문제 없으면:"
echo "  git add src/index.css src/lib/activityBadge.ts"
echo "  git commit -m 'style: 색상 팔레트 절제된 딥오션 톤으로 교체 (batch81)'"
echo "  git push"
echo ""
echo "백업 파일(.bak)은 확인 후 삭제해도 됩니다."
