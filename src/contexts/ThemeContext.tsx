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
