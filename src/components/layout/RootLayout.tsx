import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MasterRoleToolbar } from "@/components/MasterRoleToolbar";

export function RootLayout() {
  const location = useLocation();

  // 투어 카드 등에서 페이지 이동 시, 직전 페이지의 스크롤 위치가 그대로 유지되어
  // 새 페이지가 화면 아래쪽에서 시작되는 문제를 막기 위해 경로가 바뀔 때마다 맨 위로 스크롤한다.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-full">
      <Outlet />
      {import.meta.env.DEV && <MasterRoleToolbar />}
    </div>
  );
}
