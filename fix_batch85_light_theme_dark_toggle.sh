#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — batch85: 라이트 기본 테마 전환 + 다크 모드 토글 추가
#
# 배경: batch73~80에서 앱 전체를 다크 테마로 바꿨었는데, 사용자가 제공한 새 디자인
#       목업(01~10번 화면)을 보면 소비자 앱은 흰 배경 + 카드 UI가 기본이고, 다크 모드는
#       마이페이지에서 켜는 "옵션"으로 존재함. 이번 배치는 그 방향에 맞춰:
#
#  1) src/index.css — :root를 라이트 테마로 재정의하고, 기존 다크 테마 값은 새로
#     추가한 .dark 스코프로 옮김 (tailwind.config.ts의 darkMode:["class"]는 이미
#     scaffold되어 있었지만 그동안 쓰이지 않고 있었음). .admin-light는 모든 토큰을
#     다시 선언해 다크 모드가 켜져 있어도 관리자 화면(사이드바 포함)은 항상 밝게 고정.
#  2) src/contexts/ThemeContext.tsx (신규) — localStorage에 저장되는 라이트/다크 토글.
#     기본값은 항상 "라이트"(기기 다크모드 설정을 따라가지 않음).
#  3) src/components/theme/ThemeToggle.tsx (신규) — 마이페이지용 다크 모드 스위치.
#  4) src/App.tsx — ThemeProvider로 최상위를 감쌈.
#  5) src/components/brand/Logo.tsx — tone="header" 추가 (헤더 로고 워드마크가
#     라이트/다크에 따라 자동으로 색이 바뀌도록).
#  6) src/components/layout/AppHeader.tsx — 로고/타이틀/보더/버튼을 테마 반응형 토큰으로 교체.
#     (이전에 논의했던 "타이틀이 배경과 겹치는" 문제, "로고가 안 보이는" 문제를
#     라이트/다크 공용 구조로 근본적으로 해결)
#  7) src/pages/Index.tsx — 홈 히어로 텍스트를 text-foreground로 (라이트=네이비 글자,
#     다크=흰 글자 자동 전환).
#  8) src/components/SplashScreen.tsx — 스플래시는 사용자의 라이트/다크 설정과 무관하게
#     항상 브랜드 오션 그라데이션(다크 스코프)으로 고정 표시.
#  9) src/components/mypage/{Diver,Instructor,Admin}MyPageView.tsx — 다크 모드 토글을
#     마이페이지 알림 설정 옆에 추가.
#
# 참고: 나머지 화면(투어 카드, 예약, 채팅 목록 등)은 애초에 bg-card/text-foreground/
# border-border 같은 시맨틱 토큰으로 만들어져 있어서 index.css 토큰만 바뀌어도 자동으로
# 라이트/다크에 맞게 따라간다 (수백 개 파일을 일일이 고칠 필요가 없었음). 예외적으로
# InstructorArbitrationRoom/ArbitrationChatRoom/SecureExportBlock(분쟁조정 채팅방)과
# SocialAuthButtons(카카오/네이버 브랜드 색)는 의도적으로 하드코딩된 색을 그대로 둠 —
# 전자는 "항상 어두운 보안룸" 컨셉이라 테마와 무관하게 고정, 후자는 브랜드 가이드 색.
#
# 사용법: all-blue-diving 리포지토리 루트에서 실행
#   chmod +x fix_batch85_light_theme_dark_toggle.sh
#   ./fix_batch85_light_theme_dark_toggle.sh
set -euo pipefail

if [ ! -f "src/index.css" ] || [ ! -f "src/App.tsx" ]; then
  echo "오류: all-blue-diving 리포지토리 루트에서 실행해야 합니다."
  exit 1
fi

BACKUP_DIR=".batch85_backup"
mkdir -p "$BACKUP_DIR"
echo "1) 변경 대상 파일 백업 -> $BACKUP_DIR/"
mkdir -p "$BACKUP_DIR/$(dirname "src/index.css")"
[ -f "src/index.css" ] && cp "src/index.css" "$BACKUP_DIR/src/index.css" || true
mkdir -p "$BACKUP_DIR/$(dirname "src/App.tsx")"
[ -f "src/App.tsx" ] && cp "src/App.tsx" "$BACKUP_DIR/src/App.tsx" || true
mkdir -p "$BACKUP_DIR/$(dirname "src/contexts/ThemeContext.tsx")"
[ -f "src/contexts/ThemeContext.tsx" ] && cp "src/contexts/ThemeContext.tsx" "$BACKUP_DIR/src/contexts/ThemeContext.tsx" || true
mkdir -p "$BACKUP_DIR/$(dirname "src/components/theme/ThemeToggle.tsx")"
[ -f "src/components/theme/ThemeToggle.tsx" ] && cp "src/components/theme/ThemeToggle.tsx" "$BACKUP_DIR/src/components/theme/ThemeToggle.tsx" || true
mkdir -p "$BACKUP_DIR/$(dirname "src/components/brand/Logo.tsx")"
[ -f "src/components/brand/Logo.tsx" ] && cp "src/components/brand/Logo.tsx" "$BACKUP_DIR/src/components/brand/Logo.tsx" || true
mkdir -p "$BACKUP_DIR/$(dirname "src/components/layout/AppHeader.tsx")"
[ -f "src/components/layout/AppHeader.tsx" ] && cp "src/components/layout/AppHeader.tsx" "$BACKUP_DIR/src/components/layout/AppHeader.tsx" || true
mkdir -p "$BACKUP_DIR/$(dirname "src/pages/Index.tsx")"
[ -f "src/pages/Index.tsx" ] && cp "src/pages/Index.tsx" "$BACKUP_DIR/src/pages/Index.tsx" || true
mkdir -p "$BACKUP_DIR/$(dirname "src/components/SplashScreen.tsx")"
[ -f "src/components/SplashScreen.tsx" ] && cp "src/components/SplashScreen.tsx" "$BACKUP_DIR/src/components/SplashScreen.tsx" || true
mkdir -p "$BACKUP_DIR/$(dirname "src/components/mypage/DiverMyPageView.tsx")"
[ -f "src/components/mypage/DiverMyPageView.tsx" ] && cp "src/components/mypage/DiverMyPageView.tsx" "$BACKUP_DIR/src/components/mypage/DiverMyPageView.tsx" || true
mkdir -p "$BACKUP_DIR/$(dirname "src/components/mypage/InstructorMyPageView.tsx")"
[ -f "src/components/mypage/InstructorMyPageView.tsx" ] && cp "src/components/mypage/InstructorMyPageView.tsx" "$BACKUP_DIR/src/components/mypage/InstructorMyPageView.tsx" || true
mkdir -p "$BACKUP_DIR/$(dirname "src/components/mypage/AdminMyPageView.tsx")"
[ -f "src/components/mypage/AdminMyPageView.tsx" ] && cp "src/components/mypage/AdminMyPageView.tsx" "$BACKUP_DIR/src/components/mypage/AdminMyPageView.tsx" || true

echo "2) 파일 교체"
mkdir -p "src"
cat > "src/index.css" <<'FILEEOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ALL BLUE — 라이트 기본 테마 (프리미엄 딥오션 팔레트의 밝은 버전).
       #F5F7FA 라이트그레이 배경 + 흰 카드 + #0A1B2F 네이비 텍스트 + #0D47A1 블루 브랜드.
       다크 모드는 .dark 스코프(사용자가 마이페이지에서 토글)에서 정의한다. */
    --background: 216 33% 97%;
    --foreground: 212 55% 12%;

    --card: 0 0% 100%;
    --card-foreground: 212 55% 12%;

    --popover: 0 0% 100%;
    --popover-foreground: 212 55% 12%;

    /* ALL BLUE brand primary: 차분한 블루 (#0D47A1) */
    --primary: 216 85% 34%;
    --primary-foreground: 0 0% 100%;
    --primary-glow: 216 78% 55%;

    --secondary: 216 25% 95%;
    --secondary-foreground: 212 45% 16%;

    --muted: 216 20% 95%;
    --muted-foreground: 217 15% 42%;

    /* 톤 다운 틸 액센트 (#1AB6C6) — CTA, 스쿠버 뱃지, 포커스링 */
    --accent: 186 77% 38%;
    --accent-foreground: 0 0% 100%;

    --destructive: 0 72% 48%;
    --destructive-foreground: 0 0% 100%;

    --warning: 38 92% 50%;
    --warning-foreground: 26 40% 14%;

    --success: 152 55% 36%;
    --success-foreground: 0 0% 100%;

    /* 코랄 제거 → 슬레이트 그레이 (#333F52) — 프리다이빙 뱃지. 배경 톤과 무관하게
       항상 짙은 뱃지+밝은 글자 조합이라 라이트/다크 공통으로 사용한다. */
    --coral: 217 23% 26%;
    --coral-foreground: 210 20% 92%;

    --border: 216 20% 90%;
    --input: 216 20% 90%;
    --ring: 186 77% 38%;

    --radius: 1rem;

    /* 관리자 사이드바 — 라이트 화이트 사이드바 + 옅은 블루 active 상태 */
    --sidebar-background: 0 0% 100%;
    --sidebar-foreground: 212 45% 20%;
    --sidebar-primary: 216 85% 34%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 216 78% 96%;
    --sidebar-accent-foreground: 216 85% 34%;
    --sidebar-border: 216 20% 90%;
    --sidebar-ring: 216 85% 34%;

    /* ALL BLUE ocean gradients & shadows.
       gradient-ocean: 헤더/히어로 배경 — 라이트 모드에서는 거의 흰 배경에 가까운
       은은한 그라데이션(브랜드 임팩트는 다크 모드에서 나타남).
       gradient-ocean-light: 버튼 그라데이션 — 라이트/다크 공통으로 항상 블루 브랜드 색. */
    --gradient-ocean: linear-gradient(160deg, hsl(0 0% 100%) 0%, hsl(216 30% 97%) 100%);
    --gradient-ocean-light: linear-gradient(135deg, hsl(216 85% 44%) 0%, hsl(216 85% 30%) 100%);
    /* 소비자 앱 페이지 배경 그라데이션 — 거의 모든 화면(Search/Checkout/MyPage/TourDetail 등)이
       이 토큰 하나로 페이지 배경을 그린다. 관리자는 .admin-light 스코프에서 동일한 라이트 값을
       다시 선언해, 다크 모드가 켜져 있어도 관리자 화면은 항상 밝게 유지되도록 한다. */
    --gradient-surface: linear-gradient(180deg, hsl(216 33% 97%) 0%, hsl(216 25% 94%) 100%);
    --shadow-ocean: 0 20px 50px -15px hsl(212 30% 70% / 0.25);
    --shadow-ocean-glow: 0 0 40px hsl(186 77% 45% / 0.25);
  }

  /* ALL BLUE — 다크 모드 스코프. 마이페이지의 "다크 모드" 토글로 <html>에 .dark 클래스가
     붙으면 이 값들이 :root 값을 덮어써, 기존 "프리미엄 딥오션" 다크 테마가 적용된다. */
  .dark {
    --background: 212 65% 11%;
    --foreground: 200 30% 95%;

    --card: 212 55% 14%;
    --card-foreground: 200 30% 95%;

    --popover: 212 55% 14%;
    --popover-foreground: 200 30% 95%;

    --primary: 216 78% 46%;
    --primary-foreground: 0 0% 100%;
    --primary-glow: 216 75% 62%;

    --secondary: 212 45% 16%;
    --secondary-foreground: 200 30% 94%;

    --muted: 212 40% 15%;
    --muted-foreground: 200 15% 68%;

    --accent: 186 72% 48%;
    --accent-foreground: 0 0% 100%;

    --destructive: 0 78% 58%;
    --destructive-foreground: 0 0% 100%;

    --warning: 38 92% 55%;
    --warning-foreground: 26 40% 14%;

    --success: 152 55% 46%;
    --success-foreground: 0 0% 100%;

    --coral: 217 23% 26%;
    --coral-foreground: 210 20% 92%;

    --border: 212 32% 20%;
    --input: 212 32% 20%;
    --ring: 186 72% 48%;

    --sidebar-background: 212 65% 6%;
    --sidebar-foreground: 200 30% 92%;
    --sidebar-primary: 186 72% 48%;
    --sidebar-primary-foreground: 212 65% 6%;
    --sidebar-accent: 212 45% 16%;
    --sidebar-accent-foreground: 200 30% 92%;
    --sidebar-border: 212 32% 20%;
    --sidebar-ring: 186 72% 48%;

    --gradient-ocean: linear-gradient(160deg, hsl(216 80% 48%) 0%, hsl(214 58% 24%) 45%, hsl(212 65% 11%) 100%);
    --gradient-ocean-light: linear-gradient(135deg, hsl(216 80% 56%) 0%, hsl(216 78% 38%) 100%);
    --gradient-surface: linear-gradient(180deg, hsl(212 65% 11%) 0%, hsl(212 60% 8%) 100%);
    --shadow-ocean: 0 20px 50px -15px hsl(212 65% 4% / 0.5);
    --shadow-ocean-glow: 0 0 40px hsl(186 72% 48% / 0.35);
  }

  /* 관리자 백오피스 전용 스코프 — 데이터를 오래 들여다보는 관리자 화면은 다크 모드 토글과
     무관하게 항상 밝은 화면을 유지한다. .dark가 조상에 있어도 이 블록이 모든 토큰을 다시
     선언하므로 관리자 영역(사이드바 포함)은 흔들리지 않는다. */
  .admin-light {
    --background: 216 33% 97%;
    --foreground: 212 55% 12%;
    --card: 0 0% 100%;
    --card-foreground: 212 55% 12%;
    --popover: 0 0% 100%;
    --popover-foreground: 212 55% 12%;

    --primary: 216 85% 34%;
    --primary-foreground: 0 0% 100%;
    --primary-glow: 216 78% 55%;

    --secondary: 216 25% 95%;
    --secondary-foreground: 212 45% 16%;

    --muted: 216 20% 95%;
    --muted-foreground: 217 15% 42%;

    --accent: 186 77% 38%;
    --accent-foreground: 0 0% 100%;

    --destructive: 0 72% 48%;
    --destructive-foreground: 0 0% 100%;

    --warning: 38 92% 50%;
    --warning-foreground: 26 40% 14%;

    --success: 152 55% 36%;
    --success-foreground: 0 0% 100%;

    --border: 216 20% 90%;
    --input: 216 20% 90%;
    --ring: 186 77% 38%;

    --sidebar-background: 0 0% 100%;
    --sidebar-foreground: 212 45% 20%;
    --sidebar-primary: 216 85% 34%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 216 78% 96%;
    --sidebar-accent-foreground: 216 85% 34%;
    --sidebar-border: 216 20% 90%;
    --sidebar-ring: 216 85% 34%;

    --gradient-ocean: linear-gradient(160deg, hsl(0 0% 100%) 0%, hsl(216 30% 97%) 100%);
    --gradient-ocean-light: linear-gradient(135deg, hsl(216 85% 44%) 0%, hsl(216 85% 30%) 100%);
    --gradient-surface: linear-gradient(180deg, hsl(216 33% 97%) 0%, hsl(216 25% 94%) 100%);
    --shadow-ocean: 0 20px 50px -15px hsl(212 30% 70% / 0.25);
    --shadow-ocean-glow: 0 0 40px hsl(186 77% 45% / 0.25);
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-family: "Pretendard", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif;
  }
}

/* ALL BLUE — 카드 상단 얇은 Ocean Gradient 액센트 (premium, minimal, 과하지 않게) */
.accent-top-ocean {
  position: relative;
}
.accent-top-ocean::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: var(--gradient-ocean-light);
  z-index: 1;
}

html,
body,
#root {
  width: 100%;
  height: 100%;
}

/* MIMO — premium beauty reservation theme (scoped, isolated from ALL BLUE tokens) */
.mimo-theme {
  --background: 0 0% 100%;
  --foreground: 0 0% 20%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 20%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 20%;

  --primary: 0 100% 71%;
  --primary-foreground: 0 0% 100%;
  --primary-glow: 6 100% 78%;

  --secondary: 0 0% 96%;
  --secondary-foreground: 0 0% 20%;

  --muted: 0 0% 96%;
  --muted-foreground: 0 0% 45%;

  --accent: 0 100% 71%;
  --accent-foreground: 0 0% 100%;

  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 100%;

  --warning: 38 92% 50%;
  --warning-foreground: 26 40% 14%;

  --success: 152 60% 36%;
  --success-foreground: 0 0% 100%;

  --border: 0 0% 90%;
  --input: 0 0% 90%;
  --ring: 0 100% 71%;

  --radius: 1rem;

  --gradient-mimo: linear-gradient(135deg, hsl(0 100% 71%) 0%, hsl(6 100% 78%) 100%);
  --shadow-mimo: 0 10px 30px -8px hsl(0 0% 0% / 0.12);
  --shadow-mimo-sm: 0 4px 12px -4px hsl(0 0% 0% / 0.08);

  font-family: "Pretendard", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}

/* Infinite Dive — standalone retro arcade game theme (scoped, isolated from ALL BLUE/MIMO tokens) */
.game-theme {
  --background: 210 60% 4%;
  --foreground: 200 30% 94%;
  --card: 210 45% 8%;
  --card-foreground: 200 30% 94%;
  --popover: 210 45% 8%;
  --popover-foreground: 200 30% 94%;

  --primary: 189 94% 50%;
  --primary-foreground: 210 60% 6%;
  --primary-glow: 189 94% 65%;

  --secondary: 210 40% 14%;
  --secondary-foreground: 200 30% 94%;

  --muted: 210 40% 12%;
  --muted-foreground: 200 15% 60%;

  --accent: 355 100% 71%;
  --accent-foreground: 210 60% 6%;

  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;

  --warning: 45 100% 55%;
  --warning-foreground: 26 40% 10%;

  --success: 152 60% 45%;
  --success-foreground: 0 0% 100%;

  --border: 210 40% 18%;
  --input: 210 40% 18%;
  --ring: 189 94% 50%;

  --radius: 0.5rem;

  --game-coral: 0 100% 71%;
  --game-gold: 46 100% 50%;
  --gradient-game-chrome: linear-gradient(180deg, hsl(210 30% 14%) 0%, hsl(210 45% 6%) 100%);
  --shadow-game-glow: 0 0 30px hsl(189 94% 50% / 0.35);

  font-family: "Press Start 2P", "Pretendard", -apple-system, BlinkMacSystemFont, monospace;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  image-rendering: pixelated;
}
FILEEOF
echo "  - src/index.css"

mkdir -p "src"
cat > "src/App.tsx" <<'FILEEOF'
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routers } from "./router";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { SplashScreen } from "@/components/SplashScreen";

const queryClient = new QueryClient();

const SPLASH_SESSION_KEY = "allblue-splash-shown";

const App = () => {
  const router = createBrowserRouter(routers);
  // 스플래시는 브라우저 세션(탭)당 앱을 처음 열 때 딱 한 번만 보여준다.
  // 라우트별 페이지(Index.tsx 등)가 아니라 여기 최상위에서 관리해야, 페이지 이동/로그인 후
  // 리다이렉트 등으로 특정 페이지에 다시 진입할 때 광고 화면처럼 반복 노출되지 않는다.
  const [splashDone, setSplashDone] = useState(
    () => typeof window !== "undefined" && window.sessionStorage.getItem(SPLASH_SESSION_KEY) === "true",
  );

  const handleSplashFinish = () => {
    window.sessionStorage.setItem(SPLASH_SESSION_KEY, "true");
    setSplashDone(true);
  };

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <RoleProvider>
            <AppDataProvider>
              <Toaster />
              <Sonner />
              {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
              <RouterProvider router={router} />
            </AppDataProvider>
          </RoleProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
FILEEOF
echo "  - src/App.tsx"

mkdir -p "src/contexts"
cat > "src/contexts/ThemeContext.tsx" <<'FILEEOF'
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "allblue-theme";

/** localStorage에 저장된 값이 있으면 그대로 쓰고, 없으면 라이트를 기본값으로 한다.
 * (기기/브라우저의 다크모드 설정을 따라가지 않고, 항상 라이트로 시작 — 사용자가
 * 명시적으로 다크 모드를 켜야만 다크 테마가 적용된다.) */
function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
}

/**
 * ALL BLUE 전역 라이트/다크 테마 컨텍스트.
 * <html> 엘리먼트에 .dark 클래스를 붙였다 뗐다 하는 방식(tailwind darkMode: ["class"])으로
 * 동작하며, 관리자 화면(.admin-light)은 이 값과 무관하게 index.css에서 항상 밝게 고정된다.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (next: Theme) => setThemeState(next);
  const toggleTheme = () => setThemeState((prev) => (prev === "dark" ? "light" : "dark"));

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme은 ThemeProvider 내부에서만 사용할 수 있습니다.");
  return ctx;
}
FILEEOF
echo "  - src/contexts/ThemeContext.tsx"

mkdir -p "src/components/theme"
cat > "src/components/theme/ThemeToggle.tsx" <<'FILEEOF'
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * 마이페이지 공용 — 라이트/다크 모드 전환 토글. PushNotificationToggle과 동일한
 * 카드형 레이아웃을 재사용해 마이페이지 내 다른 설정 항목과 톤을 맞춘다.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
      <div className="flex items-start gap-2.5">
        {isDark ? (
          <Moon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        ) : (
          <Sun className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        )}
        <div className="space-y-0.5">
          <Label className="text-sm font-medium text-foreground">다크 모드</Label>
          <p className="break-keep text-xs text-muted-foreground">
            {isDark ? "어두운 화면으로 보고 있습니다." : "밝은 화면으로 보고 있습니다."}
          </p>
        </div>
      </div>
      <Switch checked={isDark} onCheckedChange={toggleTheme} aria-label="다크 모드 전환" />
    </div>
  );
}
FILEEOF
echo "  - src/components/theme/ThemeToggle.tsx"

mkdir -p "src/components/brand"
cat > "src/components/brand/Logo.tsx" <<'FILEEOF'
import { cn } from "@/lib/utils";

interface LogoMarkProps {
  size?: number;
  tone?: "default" | "inverted";
  className?: string;
}

/** 위치(Pin) 심벌 외곽선 — 앱 아이콘/스플래시와 100% 동일한 심벌을 사용한다. */
const PIN_PATH = "M20 3C12.27 3 6 9.27 6 17c0 11.5 14 24 14 24s14-12.5 14-24c0-7.73-6.27-14-14-14z";

/**
 * ALL BLUE 심벌 — 흰 배경 위의 파란색 위치(Pin) 심벌, 내부는 파도처럼 흐르는
 * 블루 그라데이션. 이 심벌은 앱 아이콘 / 헤더 / 스플래시 컷아웃에서 항상 동일하게 사용한다.
 */
export function LogoMark({ size = 32, tone = "default", className }: LogoMarkProps) {
  const isInverted = tone === "inverted";
  const gradFrom = isInverted ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))";
  const gradTo = isInverted ? "hsl(var(--primary-foreground))" : "hsl(var(--primary-glow))";
  const waveStroke = isInverted ? "hsl(var(--primary))" : "hsl(var(--primary-foreground))";
  const gradId = `pin-gradient-${tone}`;
  const clipId = `pin-clip-${tone}`;

  return (
    <svg
      width={size}
      height={(size * 44) / 40}
      viewBox="0 0 40 44"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="6" y1="3" x2="34" y2="41" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={gradFrom} />
          <stop offset="100%" stopColor={gradTo} />
        </linearGradient>
        <clipPath id={clipId}>
          <path d={PIN_PATH} />
        </clipPath>
      </defs>

      {!isInverted && <rect x="0" y="1" width="40" height="42" rx="12" fill="white" />}

      <path d={PIN_PATH} fill={`url(#${gradId})`} />

      {/* 파도 라인: 핀 내부에만 보이도록 클립 */}
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M2 22c2.6-2.4 5.2-2.4 7.8 0s5.2 2.4 7.8 0 5.2-2.4 7.8 0 5.2 2.4 7.8 0"
          stroke={waveStroke}
          strokeWidth="2.1"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />
        <path
          d="M2 27c2.6-2.4 5.2-2.4 7.8 0s5.2 2.4 7.8 0 5.2-2.4 7.8 0 5.2 2.4 7.8 0"
          stroke={waveStroke}
          strokeWidth="2.1"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
      </g>
    </svg>
  );
}

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  /**
   * default: 밝은 배경 위 — 파란 워드마크 (라이트 테마 일반 화면, 관리자 사이드바 등)
   * inverted: 항상 어두운 배경 위 — 흰 워드마크로 고정 (스플래시처럼 테마와 무관하게 항상
   *   어두운 화면에서만 쓰이는 곳)
   * header: 상단 헤더 전용 — 헤더 배경(gradient-ocean)이 라이트/다크 테마에 따라 밝거나
   *   어두워지므로, 워드마크 색도 text-foreground로 테마에 맞춰 자동 전환된다.
   */
  tone?: "default" | "inverted" | "header";
  className?: string;
}

const SIZE_PRESETS = {
  sm: { mark: 28, word: "text-base", tagline: "text-[10px]" },
  md: { mark: 40, word: "text-2xl", tagline: "text-xs" },
  lg: { mark: 56, word: "text-4xl md:text-5xl", tagline: "text-sm md:text-base" },
} as const;

/**
 * ALL BLUE 완성형 로고 lockup — 왼쪽 심벌 + 오른쪽 "ALL BLUE" 워드마크,
 * 그 아래 "모든 바다가 만나는 곳" 태그라인(옵션).
 */
export function Logo({ size = "sm", showTagline = false, tone = "default", className }: LogoProps) {
  const preset = SIZE_PRESETS[size];
  // 심벌(핀 아이콘)은 흰 배지 위에 파란 핀이 올라가는 "default" 스타일이 라이트/다크 헤더
  // 모두에서 자연스럽게 보이므로, header 톤에서도 심벌 자체는 default를 그대로 쓴다.
  const markTone = tone === "inverted" ? "inverted" : "default";
  const wordColor =
    tone === "inverted" ? "text-primary-foreground" : tone === "header" ? "text-foreground" : "text-primary";
  const taglineColor =
    tone === "inverted"
      ? "text-primary-foreground/75"
      : tone === "header"
        ? "text-foreground/70"
        : "text-muted-foreground";

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={preset.mark} tone={markTone} />
      <div className="flex flex-col leading-tight">
        <span className={cn("font-bold tracking-tight", preset.word, wordColor)}>ALL BLUE</span>
        {showTagline && (
          <span className={cn("font-medium tracking-tight", preset.tagline, taglineColor)}>
            모든 바다가 만나는 곳
          </span>
        )}
      </div>
    </div>
  );
}
FILEEOF
echo "  - src/components/brand/Logo.tsx"

mkdir -p "src/components/layout"
cat > "src/components/layout/AppHeader.tsx" <<'FILEEOF'
import { Link } from "react-router-dom";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { useRole } from "@/contexts/RoleContext";

interface AppHeaderProps {
  title?: string;
  showLanguage?: boolean;
}

export function AppHeader({ title, showLanguage = false }: AppHeaderProps) {
  const { isLoggedIn } = useRole();

  // bg-gradient-ocean/shadow-ocean은 index.css의 브랜드 그라데이션·그림자 토큰을
  // 재사용한다. 이 토큰은 라이트 테마에서는 흰 배경에 가깝게, .dark 스코프에서는
  // 짙은 네이비 그라데이션으로 자동 전환되므로 헤더 마크업은 테마와 무관하게 동일하다.
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-gradient-ocean shadow-ocean">
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4 md:max-w-lg">
        <Link to="/" className="flex items-center gap-2">
          {title ? (
            <span className="text-base font-bold tracking-tight text-foreground">{title}</span>
          ) : (
            <Logo size="sm" tone="header" />
          )}
        </Link>
        <div className="flex items-center gap-2">
          {!isLoggedIn && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 border-border bg-foreground/5 text-xs text-foreground hover:bg-foreground/10 hover:text-foreground"
            >
              <Link to="/auth">로그인 / 회원가입</Link>
            </Button>
          )}
          <NotificationBell />
          {showLanguage && <LanguageSwitcher className="h-8 min-w-[100px] text-xs" />}
        </div>
      </div>
    </header>
  );
}
FILEEOF
echo "  - src/components/layout/AppHeader.tsx"

mkdir -p "src/pages"
cat > "src/pages/Index.tsx" <<'FILEEOF'
import { useState } from "react";
import { Megaphone, ShieldCheck, MessageCircle, CalendarCheck, Lock, Users } from "lucide-react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { SearchForm } from "@/components/search/SearchForm";
import { TourCard } from "@/components/search/TourCard";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";

interface Feature {
  icon: typeof ShieldCheck;
  title: string;
  desc: string;
}

// "ALL BLUE만의 특별함" — 시안 하단 6개 피처 스트립과 동일한 구성.
const FEATURES: Feature[] = [
  { icon: Users, title: "신뢰할 수 있는 강사", desc: "인증된 강사진이 함께하는 안전한 투어" },
  { icon: ShieldCheck, title: "안전 최우선", desc: "철저한 안전 관리 시스템으로 안심 투어" },
  { icon: MessageCircle, title: "실시간 소통", desc: "강사와 다이버가 실시간으로 소통해요" },
  { icon: CalendarCheck, title: "간편한 예약", desc: "몇 번의 터치로 간편하게 예약 완료" },
  { icon: Lock, title: "안전한 결제", desc: "SSL 보안 시스템으로 안전한 결제" },
  { icon: Users, title: "다이버 커뮤니티", desc: "후기와 정보를 나누는 다이버 공간" },
];

const Index = () => {
  const { role, authLoading } = useRole();
  const { tours: allTours, notices } = useAppData();
  const location = useLocation();
  // 강사가 하단 네비게이션의 "투어 홈"을 직접 눌러 이동한 경우에는 state로 표시되어 있어
  // 아래 자동 리다이렉트를 건너뛰고 이 화면을 그대로 보여준다.
  const instructorBrowsing = (location.state as { instructorBrowsing?: boolean } | null)?.instructorBrowsing === true;

  // 홈 화면 검색 폼의 "출발 월" 선택 상태. 여기서 관리해서 월을 고르는 즉시(페이지 이동 없이)
  // 아래 "모집중인 투어" 목록을 바로 필터링한다. 복수 선택 가능.
  // (React Hooks 규칙상 아래 조건부 return들보다 반드시 먼저 호출되어야 한다.)
  const [months, setMonths] = useState<number[]>([]);

  // 로그인 역할에 따라 첫 화면을 분기한다: 강사는 대시보드, 관리자는 관리자 홈,
  // 비회원/다이버만 이 투어 홈 화면을 그대로 본다.
  if (!authLoading && role === "instructor" && !instructorBrowsing) {
    return <Navigate to="/instructor" replace />;
  }
  if (!authLoading && role === "admin") {
    return <Navigate to="/admin/home" replace />;
  }

  // 관리자가 정지/보류 처리한 투어는 다이버에게 노출하지 않는다.
  // 모집 마감되었거나(최소 인원 미달로 취소된 경우 포함) 관리자가 정지/보류 처리한 투어는
  // 홈 화면 "모집중인 투어" 목록에서 제외한다 — 더 이상 예약을 받을 수 없기 때문.
  const tours = allTours
    .filter((t) => !t.adminStatus && t.status === "open")
    .filter((t) => months.length === 0 || months.includes(new Date(t.startDate).getMonth()));
  const pinnedNotice = notices.find((n) => n.pinned);

  return (
    <div className="min-h-full bg-gradient-surface pb-20">
      <AppHeader showLanguage />

      {/* 히어로 — bg-gradient-ocean은 라이트 테마에서는 흰 배경에 가깝고, 다크 모드에서는
          오션 그라데이션으로 바뀐다. 텍스트도 text-foreground라 두 테마 모두에서 대비가 맞다. */}
      <div className="relative overflow-hidden bg-gradient-ocean px-4 pb-8 pt-8 text-center md:pb-10 md:pt-10">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background:radial-gradient(circle_at_30%_20%,white,transparent_45%)]" />
        <div className="relative mx-auto flex max-w-md flex-col items-center gap-2 md:max-w-lg">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground md:text-3xl">
            다이빙의 모든 순간,
            <br />
            ALL BLUE와 함께
          </h1>
          <p className="text-sm text-foreground/70">
            특별한 바다, 특별한 경험을 찾고 예약할 수 있습니다.
          </p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-md space-y-6 px-4 pt-6 pb-6 md:max-w-lg">
        {pinnedNotice && (
          <Link
            to="/support"
            className="flex items-start gap-2 rounded-xl border border-primary/30 bg-secondary/40 p-3 text-xs text-foreground transition-colors hover:bg-secondary"
          >
            <Megaphone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="line-clamp-1 break-keep">{pinnedNotice.title}</span>
          </Link>
        )}

        <SearchForm months={months} onMonthsChange={setMonths} />

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">모집중인 투어</h2>
            <span className="text-xs text-muted-foreground">{tours.length}개 투어</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        </section>

        {/* ALL BLUE만의 특별함 — 시안 하단 피처 스트립 */}
        <section className="space-y-3 pt-2">
          <h2 className="text-base font-semibold text-foreground">ALL BLUE만의 특별함</h2>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <f.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{f.title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
};

export default Index;
FILEEOF
echo "  - src/pages/Index.tsx"

mkdir -p "src/components"
cat > "src/components/SplashScreen.tsx" <<'FILEEOF'
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/brand/Logo";

interface SplashScreenProps {
  onFinish?: () => void;
}

const TOTAL_DURATION_MS = 3000;

interface WaveLayerProps {
  path: string;
  className: string;
  duration: number;
  delay?: number;
  translateY?: number;
}

/** 여러 겹의 파도가 서로 다른 속도로 계속 흘러가는 레이어. */
function WaveLayer({ path, className, duration, delay = 0, translateY = 0 }: WaveLayerProps) {
  return (
    <motion.svg
      className={`absolute bottom-0 left-0 w-[220%] ${className}`}
      style={{ translateY }}
      viewBox="0 0 1440 320"
      fill="currentColor"
      animate={{ x: ["0%", "-50%"] }}
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
    >
      <path d={path} />
    </motion.svg>
  );
}

const WAVE_PATH_A =
  "M0,192L48,197.3C96,203,192,213,288,213.3C384,213,480,203,576,181.3C672,160,768,128,864,133.3C960,139,1056,181,1152,192C1248,203,1344,181,1392,170.7L1440,160L1440,320L0,320Z";
const WAVE_PATH_B =
  "M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L0,320Z";
const WAVE_PATH_C =
  "M0,256L60,240C120,224,240,192,360,181.3C480,171,600,181,720,197.3C840,213,960,235,1080,229.3C1200,224,1320,192,1380,176L1440,160L1440,320L0,320Z";

/**
 * 파도/바다 테마 모션 스플래시 — 배경 가득 여러 겹의 파도가 끊임없이 흐르고,
 * 그 위로 ALL BLUE 로고(앱 아이콘과 동일 심벌)가 떠오르듯 등장한 뒤 홈으로 Fade.
 */
export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);
  const [showLogo, setShowLogo] = useState(false);
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setShowLogo(true), 200),
      setTimeout(() => setShowTagline(true), 900),
      setTimeout(() => setVisible(false), TOTAL_DURATION_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          // "dark" 클래스를 이 컨테이너에 직접 붙여, 사용자의 라이트/다크 모드 설정과
          // 무관하게 스플래시는 항상 브랜드 오션 그라데이션(다크 스코프 토큰)으로 보이게 한다.
          className="dark fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-gradient-ocean"
        >
          {/* 위쪽에서 은은하게 번지는 빛 */}
          <div className="absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary-glow)/0.35),_transparent_65%)]" />

          {/* 계속 흘러가는 파도 레이어들 (뒤에서 앞으로, 느리게 → 빠르게) */}
          <WaveLayer path={WAVE_PATH_C} className="text-primary-glow/10" duration={14} translateY={40} />
          <WaveLayer path={WAVE_PATH_B} className="text-accent/20" duration={9} delay={0.2} translateY={20} />
          <WaveLayer path={WAVE_PATH_A} className="text-primary-glow/30" duration={6} delay={0.4} />

          <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 12 }}
              animate={
                showLogo ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.7, opacity: 0, y: 12 }
              }
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <Logo size="lg" tone="inverted" />
            </motion.div>

            <motion.p
              className="text-sm text-primary-foreground/80 sm:text-base"
              initial={{ opacity: 0, y: 8 }}
              animate={showTagline ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              모든 바다가 만나는 곳
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
FILEEOF
echo "  - src/components/SplashScreen.tsx"

mkdir -p "src/components/mypage"
cat > "src/components/mypage/DiverMyPageView.tsx" <<'FILEEOF'
import { Link } from "react-router-dom";
import { CalendarCheck, ChevronRight, MessageCircleQuestion, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LicenseVaultCard } from "@/components/mypage/LicenseVaultCard";
import { DiverSafetyProfileCard } from "@/components/mypage/DiverSafetyProfileCard";
import { InquiryHistoryList } from "@/components/mypage/InquiryHistoryList";
import { AccountActions } from "@/components/mypage/AccountActions";
import { PushNotificationToggle } from "@/components/mypage/PushNotificationToggle";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { PolicyDisclosure } from "@/components/policy/PolicyDisclosure";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";

export function DiverMyPageView() {
  const { diverProfiles } = useAppData();
  const { currentDiverId } = useRole();
  const profile = diverProfiles.find((p) => p.id === currentDiverId);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <Avatar className="h-14 w-14 border-2 border-accent/40">
          <AvatarFallback className="bg-gradient-ocean-light text-primary-foreground">
            <User className="h-7 w-7" />
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-base font-semibold text-foreground">
            안녕하세요, {profile?.name ?? "게스트 다이버"}님!
          </p>
          <p className="text-xs text-muted-foreground">{profile?.phone ?? "-"}</p>
        </div>
      </div>

      <LicenseVaultCard />

      <DiverSafetyProfileCard profile={profile} diverId={currentDiverId} />

      {/* 시안의 메뉴 리스트(아이콘 + 라벨 + 화살표) 구성을 그대로 적용 */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Link
          to="/my-bookings"
          className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/40"
        >
          <CalendarCheck className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex-1">내 예약 내역 보기</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
        <div className="border-t border-border" />
        <Link
          to="/support"
          className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/40"
        >
          <MessageCircleQuestion className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex-1">1:1 고객센터 문의</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">문의 내역</h3>
        <InquiryHistoryList diverId={currentDiverId} />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">주요 정책 및 안전 규정</h3>
        <PolicyDisclosure />
      </div>

      <PushNotificationToggle />

      <ThemeToggle />

      <AccountActions />

      <Link
        to="/instructor"
        className="block rounded-xl border border-dashed border-primary/40 bg-secondary/40 p-4 text-center text-xs text-muted-foreground"
      >
        강사이신가요? 마스터 테스트 툴바에서 &quot;강사&quot; 역할로 전환해보세요.
      </Link>
    </div>
  );
}
FILEEOF
echo "  - src/components/mypage/DiverMyPageView.tsx"

mkdir -p "src/components/mypage"
cat > "src/components/mypage/InstructorMyPageView.tsx" <<'FILEEOF'
import { useState } from "react";
import { Link } from "react-router-dom";
import { FileCheck2, Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerifiedBadge } from "@/components/tour/VerifiedBadge";
import { SettlementLedger } from "@/components/instructor/SettlementLedger";
import { InstructorNotificationCenter } from "@/components/instructor/InstructorNotificationCenter";
import { InstructorProfileEditCard } from "@/components/mypage/InstructorProfileEditCard";
import { AccountActions } from "@/components/mypage/AccountActions";
import { PushNotificationToggle } from "@/components/mypage/PushNotificationToggle";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { formatDateKR, isPastDate } from "@/lib/dates";
import { handleImageFallback, IMAGE_PLACEHOLDER } from "@/lib/image";

export function InstructorMyPageView() {
  const { getInstructorById, getInstructorProfileById, tours } = useAppData();
  const { currentInstructorId } = useRole();
  const instructor = getInstructorById(currentInstructorId);
  const instructorProfile = instructor ? getInstructorProfileById(instructor.profileId) : undefined;
  const [tab, setTab] = useState("recruiting");

  if (!instructor) return null;

  const myTours = tours.filter((t) => t.instructorId === currentInstructorId);
  const recruitingTours = myTours.filter((t) => t.status === "open" && !isPastDate(t.recruitmentDeadline));
  const completedTours = myTours.filter((t) => t.status === "closed" || isPastDate(t.endDate));

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border border-border">
              <AvatarImage src={instructor.avatarUrl} alt={instructor.name} />
              <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                {instructor.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-sm font-semibold text-foreground">{instructor.name} 강사</p>
                {instructor.agency && (
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                    {instructor.agency}
                  </Badge>
                )}
              </div>
              {instructor.verified ? (
                <VerifiedBadge className="mt-1" />
              ) : (
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  인증 심사 대기중
                </Badge>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {instructor.licenseFileNames.map((file) => (
              <div
                key={file}
                className="flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5 text-xs text-secondary-foreground"
              >
                <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-success" />
                <span className="truncate">{file}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <InstructorProfileEditCard instructor={instructor} profile={instructorProfile} />

      <InstructorNotificationCenter instructorId={currentInstructorId} />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">내가 개설한 투어 관리</h3>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recruiting">모집중 ({recruitingTours.length})</TabsTrigger>
            <TabsTrigger value="completed">완료 ({completedTours.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="recruiting" className="space-y-2 pt-3">
            {recruitingTours.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">모집중인 투어가 없습니다.</p>
            ) : (
              recruitingTours.map((tour) => (
                <Card key={tour.id}>
                  <CardContent className="space-y-2 p-3">
                    <Link to={`/chat/${tour.id}`} className="flex items-center gap-3">
                      <img
                        src={tour.mainImageUrl || IMAGE_PLACEHOLDER}
                        alt={tour.title}
                        onError={handleImageFallback}
                        className="h-12 w-12 shrink-0 rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-foreground">{tour.title}</p>
                        <p className="text-xs text-muted-foreground">
                          모집마감 {formatDateKR(tour.recruitmentDeadline)}
                        </p>
                      </div>
                      <Badge>모집중</Badge>
                    </Link>
                    <Button asChild size="sm" variant="outline" className="w-full gap-1 text-xs">
                      <Link to={`/instructor/tours/${tour.id}/edit`}>
                        <Pencil className="h-3.5 w-3.5" />
                        투어 정보 수정
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          <TabsContent value="completed" className="space-y-2 pt-3">
            {completedTours.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">완료된 투어가 없습니다.</p>
            ) : (
              completedTours.map((tour) => (
                <Card key={tour.id}>
                  <Link to={`/chat/${tour.id}`}>
                    <CardContent className="flex items-center gap-3 p-3">
                      <img
                        src={tour.mainImageUrl || IMAGE_PLACEHOLDER}
                        alt={tour.title}
                        onError={handleImageFallback}
                        className="h-12 w-12 shrink-0 rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-foreground">{tour.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDateKR(tour.endDate)} 종료</p>
                      </div>
                      <Badge variant="secondary">완료</Badge>
                    </CardContent>
                  </Link>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">정산 원장</h3>
        <SettlementLedger instructorId={currentInstructorId} />
      </div>

      <PushNotificationToggle />

      <ThemeToggle />

      <AccountActions />
    </div>
  );
}
FILEEOF
echo "  - src/components/mypage/InstructorMyPageView.tsx"

mkdir -p "src/components/mypage"
cat > "src/components/mypage/AdminMyPageView.tsx" <<'FILEEOF'
import {
  LayoutDashboard,
  Compass,
  CalendarCheck,
  Wallet,
  Users,
  Building2,
  UserRound,
  MessageCircle,
  Flag,
  Bell,
  BarChart3,
  Settings,
  BookOpen,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TelemetryCards } from "@/components/admin/TelemetryCards";
import { CancellationReviewQueue } from "@/components/admin/CancellationReviewQueue";
import { AccountActions } from "@/components/mypage/AccountActions";
import { PushNotificationToggle } from "@/components/mypage/PushNotificationToggle";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminToursPage from "@/pages/admin/AdminToursPage";
import AdminBookingsPage from "@/pages/admin/AdminBookingsPage";
import AdminPayoutsPage from "@/pages/admin/AdminPayoutsPage";
import AdminInstructorsPage from "@/pages/admin/AdminInstructorsPage";
import AdminCentersPage from "@/pages/admin/AdminCentersPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminSupportPage from "@/pages/admin/AdminSupportPage";
import AdminReportsPage from "@/pages/admin/AdminReportsPage";
import AdminNotificationsPage from "@/pages/admin/AdminNotificationsPage";
import AdminAnalyticsPage from "@/pages/admin/AdminAnalyticsPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminManualPage from "@/pages/admin/AdminManualPage";

const SECTIONS = [
  { value: "dashboard", label: "대시보드", icon: LayoutDashboard, content: <AdminDashboardPage /> },
  { value: "tours", label: "투어 관리", icon: Compass, content: <AdminToursPage /> },
  {
    value: "bookings",
    label: "예약 관리",
    icon: CalendarCheck,
    content: (
      <div className="space-y-4">
        <CancellationReviewQueue />
        <AdminBookingsPage />
      </div>
    ),
  },
  { value: "payouts", label: "정산 관리", icon: Wallet, content: <AdminPayoutsPage /> },
  { value: "instructors", label: "강사 관리", icon: Users, content: <AdminInstructorsPage /> },
  { value: "centers", label: "센터 관리", icon: Building2, content: <AdminCentersPage /> },
  { value: "users", label: "회원 관리", icon: UserRound, content: <AdminUsersPage /> },
  { value: "support", label: "문의 관리", icon: MessageCircle, content: <AdminSupportPage /> },
  { value: "reports", label: "신고 관리", icon: Flag, content: <AdminReportsPage /> },
  { value: "notifications", label: "알림 관리", icon: Bell, content: <AdminNotificationsPage /> },
  { value: "analytics", label: "통계 분석", icon: BarChart3, content: <AdminAnalyticsPage /> },
  { value: "settings", label: "시스템 설정", icon: Settings, content: <AdminSettingsPage /> },
  { value: "manual", label: "운영 매뉴얼", icon: BookOpen, content: <AdminManualPage /> },
];

export function AdminMyPageView() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">백오피스 요약</h3>
        <TelemetryCards />
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <AccordionItem
              key={section.value}
              value={section.value}
              className="rounded-xl border border-border bg-card px-3"
            >
              <AccordionTrigger className="py-3 text-sm font-semibold text-foreground hover:no-underline">
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  {section.label}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1">{section.content}</AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <PushNotificationToggle />

      <ThemeToggle />

      <AccountActions />
    </div>
  );
}
FILEEOF
echo "  - src/components/mypage/AdminMyPageView.tsx"


echo ""
echo "3) 검증 실행"
npx tsc --noEmit
npm run lint
npm run build

echo ""
echo "완료. 문제 없으면:"
echo "  git add src/index.css src/App.tsx src/contexts/ThemeContext.tsx src/components/theme/ThemeToggle.tsx \\"
echo "          src/components/brand/Logo.tsx src/components/layout/AppHeader.tsx src/pages/Index.tsx \\"
echo "          src/components/SplashScreen.tsx src/components/mypage/DiverMyPageView.tsx \\"
echo "          src/components/mypage/InstructorMyPageView.tsx src/components/mypage/AdminMyPageView.tsx"
echo "  git commit -m 'feat: 라이트 기본 테마 전환 + 다크 모드 토글 추가 (batch85)'"
echo "  git push"
echo ""
echo "백업은 \$BACKUP_DIR/ 에 있습니다. 확인 후 삭제해도 됩니다: rm -rf $BACKUP_DIR"
