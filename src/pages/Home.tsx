import { Navigate, useLocation } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import Landing from "./Landing";

/**
 * "/" 진입점. 비로그인·로그인(다이버) 모두 동일한 리디자인 랜딩(Landing)을 본다.
 * 로그인 시에만 달라지는 요소(하단 네비 등)는 Landing 안에서 최소한으로 얹는다.
 *
 * 역할 라우팅(예약 플로우와 무관): 강사는 콘솔(/instructor), 관리자는 관리자 홈으로 보낸다.
 * 단, 강사가 하단 네비 "투어 홈"으로 직접 들어온 경우(state.instructorBrowsing)는 랜딩을 그대로 보여준다.
 */
export default function Home() {
  const { role, authLoading } = useRole();
  const location = useLocation();
  const instructorBrowsing =
    (location.state as { instructorBrowsing?: boolean } | null)?.instructorBrowsing === true;

  if (authLoading) return null;
  if (role === "instructor" && !instructorBrowsing) return <Navigate to="/instructor" replace />;
  if (role === "admin") return <Navigate to="/admin/home" replace />;
  return <Landing />;
}
