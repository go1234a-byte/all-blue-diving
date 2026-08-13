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

  // 반대 방향 가드: 로그인 직후/회원가입 직후에는 세션이 생기는 시점과 profile row가 실제로
  // 채워지는 시점 사이에 항상 약간의 시차가 있다(원인이 하나가 아니었다 — 로그인 순간의
  // authLoading 갱신 틈, 토큰 자동 갱신, 회원가입 폼 자체의 INSERT와 이 profile 조회 SELECT
  // 간의 경쟁 등, 여러 건을 각각 고쳤다). 그 찰나에 위 가드가 먼저 발동해 실제로는 profile이
  // 멀쩡한 계정도 /complete-profile로 보내질 수 있다. 원인을 하나씩 막기보다, "이미 profile이
  // 있는 채로 이 화면에 남아있다"는 결과 자체를 감지해 되돌리는 게 더 근본적이다 — 앞으로 또
  // 다른 타이밍 문제가 생겨도 이 한 줄이 계속 막아준다.
  const shouldLeaveCompleteProfile =
    isLoggedIn && !authLoading && !!profile && location.pathname === "/complete-profile";

  return (
    <div className="min-h-full">
      {needsProfileCompletion || shouldLeaveCompleteProfile ? (
        <Navigate to={needsProfileCompletion ? "/complete-profile" : "/"} replace />
      ) : (
        <Outlet />
      )}
      {import.meta.env.DEV && <MasterRoleToolbar />}
    </div>
  );
}
