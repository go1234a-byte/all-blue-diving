#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — batch83: "전체적으로 너무 어둡다" 피드백 반영
# 원인: batch81에서 --primary(버튼/브랜드 컬러)를 34% 명도로 너무 낮게 잡고
#       --gradient-ocean-light(버튼 그라데이션)도 어둡게 잡아, 배경은 오히려
#       예전보다 밝아졌는데도 포인트 컬러가 죽어있어 전체가 칙칙해 보임.
# 수정: 배경/카드 톤 구조는 그대로 두고 primary/accent/그라데이션의 밝기만 상향.
#   --primary        216 85% 34% -> 216 78% 46%
#   --primary-glow    216 80% 50% -> 216 75% 62%
#   --accent          186 77% 44% -> 186 72% 48%
#   --ring/--sidebar-primary/--sidebar-ring 도 새 accent 값으로 동기화
#   --gradient-ocean       상단 시작색 40% -> 48% (중간 지점도 함께 상향)
#   --gradient-ocean-light 56%/38% (기존 48%/30%에서 상향, 모노크롬 유지)
#   --shadow-ocean-glow 새 accent 값으로 동기화
#
# 사용법: all-blue-diving 리포지토리 루트에서 실행
#   chmod +x fix_batch83_brighten_palette.sh
#   ./fix_batch83_brighten_palette.sh
set -euo pipefail

if [ ! -f "src/index.css" ]; then
  echo "오류: all-blue-diving 리포지토리 루트에서 실행해야 합니다 (src/index.css 를 찾을 수 없음)."
  exit 1
fi

echo "1) src/index.css 백업 -> src/index.css.bak"
cp src/index.css src/index.css.bak

echo "2) src/index.css :root 블록 교체 (밝기 상향)"
python3 - "$PWD/src/index.css" <<'PYEOF'
import re, sys

path = sys.argv[1]
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

new_root = """  :root {
    /* ALL BLUE — 절제된 딥오션 팔레트: 네이비/블루/틸 모노크롬, 코랄 제거
       (batch83: 전체적으로 어둡다는 피드백 반영 — primary/accent/그라데이션 밝기 상향) */
    --background: 212 65% 11%;
    --foreground: 200 30% 95%;

    --card: 212 55% 14%;
    --card-foreground: 200 30% 95%;

    --popover: 212 55% 14%;
    --popover-foreground: 200 30% 95%;

    /* ALL BLUE brand primary: 차분한 블루 (#0D47A1 기반, 밝기 상향) */
    --primary: 216 78% 46%;
    --primary-foreground: 0 0% 100%;
    --primary-glow: 216 75% 62%;

    --secondary: 212 45% 16%;
    --secondary-foreground: 200 30% 94%;

    --muted: 212 40% 15%;
    --muted-foreground: 200 15% 68%;

    /* 톤 다운 틸 액센트 (#1AB6C6 기반, 밝기 상향) — CTA, 스쿠버 뱃지, 포커스링 */
    --accent: 186 72% 48%;
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
    --ring: 186 72% 48%;

    --radius: 1rem;

    --sidebar-background: 212 65% 6%;
    --sidebar-foreground: 200 30% 92%;
    --sidebar-primary: 186 72% 48%;
    --sidebar-primary-foreground: 212 65% 6%;
    --sidebar-accent: 212 45% 16%;
    --sidebar-accent-foreground: 200 30% 92%;
    --sidebar-border: 212 32% 20%;
    --sidebar-ring: 186 72% 48%;

    /* ALL BLUE ocean gradients & shadows — 모노크롬 블루 유지, 밝기만 상향 */
    --gradient-ocean: linear-gradient(160deg, hsl(216 80% 48%) 0%, hsl(214 58% 24%) 45%, hsl(212 65% 11%) 100%);
    --gradient-ocean-light: linear-gradient(135deg, hsl(216 80% 56%) 0%, hsl(216 78% 38%) 100%);
    /* 소비자 앱 페이지 배경 그라데이션 — 거의 모든 화면(Search/Checkout/MyPage/TourDetail 등)이
       이 토큰 하나로 페이지 배경을 그린다. 관리자는 .admin-light 스코프에서 밝은 값으로 되돌린다. */
    --gradient-surface: linear-gradient(180deg, hsl(212 65% 11%) 0%, hsl(212 60% 8%) 100%);
    --shadow-ocean: 0 20px 50px -15px hsl(212 65% 4% / 0.5);
    --shadow-ocean-glow: 0 0 40px hsl(186 72% 48% / 0.35);
  }"""

root_pattern = re.compile(r"  :root \{.*?\n  \}", re.DOTALL)
content, n1 = root_pattern.subn(new_root, content, count=1)

if n1 != 1:
    print(f"경고: :root 치환 {n1}건 (1건이어야 정상). 파일 구조가 변경되었을 수 있으니 index.css.bak과 비교해 수동 확인하세요.")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("index.css 업데이트 완료 (.admin-light는 이번 배치에서 변경하지 않음)")
PYEOF

echo ""
echo "3) 검증 실행"
npx tsc --noEmit
npm run lint
npm run build

echo ""
echo "완료. 문제 없으면:"
echo "  git add src/index.css"
echo "  git commit -m 'style: primary/accent/그라데이션 밝기 상향 — 전체적으로 어둡다는 피드백 반영 (batch83)'"
echo "  git push"
echo ""
echo "백업 파일(.bak)은 확인 후 삭제해도 됩니다."
