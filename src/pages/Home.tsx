import { useRole } from "@/contexts/RoleContext";
import Index from "./Index";
import Landing from "./Landing";

/**
 * "/" 진입점. 비로그인 방문자에게는 마케팅 랜딩(Landing)을 — 웹·네이티브 앱 공통 —,
 * 로그인 상태에는 기존 앱 홈(Index)을 보여준다. Index 자체가 강사/관리자 리다이렉트를
 * 이미 처리하므로 여기서는 "로그인 여부"만 갈라낸다.
 */
export default function Home() {
  const { isLoggedIn, authLoading } = useRole();

  if (authLoading) return null;
  if (!isLoggedIn) return <Landing />;
  return <Index />;
}
