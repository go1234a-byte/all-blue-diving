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

  // "dark" 스코프를 헤더에만 적용해 배경/텍스트/보더 등 전역 토큰이 자동으로
  // 어두운 배색으로 뒤집히게 한다(NotificationBell/Button 등 하위 컴포넌트 수정 없이
  // 프리미엄 딥오션 헤더를 적용하기 위한 트릭). bg-gradient-ocean/shadow-ocean은
  // index.css에 이미 정의된 브랜드 그라데이션·그림자 토큰을 그대로 재사용한다.
  return (
    <header className="dark sticky top-0 z-30 border-b border-white/10 bg-gradient-ocean shadow-ocean">
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
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 border-white/20 bg-white/5 text-xs text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
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
