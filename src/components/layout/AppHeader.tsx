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

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4 md:max-w-lg">
        <Link to="/" className="flex items-center gap-2">
          {title ? (
            <span className="text-base font-bold tracking-tight text-primary">{title}</span>
          ) : (
            <Logo size="sm" />
          )}
        </Link>
        <div className="flex items-center gap-2">
          {!isLoggedIn && (
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">
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
