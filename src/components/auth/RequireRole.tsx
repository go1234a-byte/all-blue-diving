import { Navigate, Outlet } from "react-router-dom";
import { useRole, type MasterRole } from "@/contexts/RoleContext";

interface RequireRoleProps {
  allow: MasterRole[];
}

/**
 * 보호된 라우트 가드. 세션 로딩 중에는 대기하고,
 * 비로그인 또는 역할 불일치 시 /auth로 리다이렉트한다.
 */
export function RequireRole({ allow }: RequireRoleProps) {
  const { role, isLoggedIn, authLoading } = useRole();

  if (authLoading) {
    return (
      <div className="flex min-h-full items-center justify-center p-10 text-sm text-muted-foreground">
        인증 정보를 확인하는 중...
      </div>
    );
  }

  // 개발 환경에서는 MasterRoleToolbar로 역할을 강제 전환할 수 있으므로 role만으로 판단한다.
  // 프로덕션에서는 실제 로그인 세션이 있어야 하며 role도 일치해야 한다.
  const hasAccess = import.meta.env.DEV ? allow.includes(role) : isLoggedIn && allow.includes(role);

  if (!hasAccess) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}
