import { Link, NavLink } from "react-router-dom";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { getNavItems } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";

interface AppHeaderProps {
  title?: string;
  showLanguage?: boolean;
}

export function AppHeader({ title, showLanguage = false }: AppHeaderProps) {
  const { isLoggedIn, role } = useRole();
  const navItems = getNavItems(role);

  // bg-gradient-ocean/shadow-ocean은 index.css의 브랜드 그라데이션·그림자 토큰을
  // 재사용한다. 이 토큰은 라이트 테마에서는 흰 배경에 가깝게, .dark 스코프에서는
  // 짙은 네이비 그라데이션으로 자동 전환되므로 헤더 마크업은 테마와 무관하게 동일하다.
  return (
    <header
      className="sticky top-0 z-30 border-b border-border bg-gradient-ocean shadow-ocean"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4 md:h-16 md:max-w-6xl md:px-6">
        <Link to="/" className="flex items-center gap-2">
          {title ? (
            <span className="text-base font-bold tracking-tight text-foreground">{title}</span>
          ) : (
            <Logo size="sm" tone="header" />
          )}
        </Link>

        {/* 데스크톱 전용 상단 내비 — 모바일에서는 하단 탭바(BottomNav)가 이 역할을 한다. */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              state={item.state}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-foreground/10 text-foreground"
                    : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

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
