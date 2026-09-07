import { Capacitor } from "@capacitor/core";
import { useRole } from "@/contexts/RoleContext";
import Index from "./Index";
import Landing from "./Landing";

/**
 * "/" 진입점. 비로그인 웹 방문자에게는 마케팅 랜딩(Landing)을, 그 외(네이티브 앱 또는
 * 로그인 상태)에는 기존 앱 홈(Index)을 보여준다. Index 자체가 강사/관리자 리다이렉트와
 * 게스트 홈 렌더를 이미 처리하므로, 여기서는 "웹 + 게스트"만 갈라낸다.
 */
export default function Home() {
  const { isLoggedIn, authLoading } = useRole();
  const isNative = Capacitor.isNativePlatform();

  if (authLoading) return null;
  if (!isNative && !isLoggedIn) return <Landing />;
  return <Index />;
}
