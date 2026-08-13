import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { MasterRoleToolbar } from "@/components/MasterRoleToolbar";
import { useRole } from "@/contexts/RoleContext";

export function RootLayout() {
  const location = useLocation();
  const { isLoggedIn, authLoading, profile } = useRole();

  // 투어 카드 등에서 페이지 이동 시, 직전 페이지의 스크롤 위치가 그대로 유지되어
  // 새 페이지가 화면 아래쪽에서 시작되는 문제를 막기 위해 경로가 바뀔 때마다 맨 위로 스크롤한다.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // 카카오 등 SNS 로그인은 auth 계정만 즉시 만들어지고 profiles row가 없는 채로 앱에
  // 들어온다(이메일 가입처럼 이름/연락처를 먼저 받을 방법이 없음). 로그인은 됐는데
  // profiles가 없는 사용자는 어느 페이지로 들어오든 추가 정보 입력 화면으로 보낸다.
  const needsProfileCompletion =
    isLoggedIn && !authLoading && !profile && location.pathname !== "/complete-profile";

  return (
    <div className="min-h-full">
      {needsProfileCompletion ? <Navigate to="/complete-profile" replace /> : <Outlet />}
      {import.meta.env.DEV && <MasterRoleToolbar />}
    </div>
  );
}
