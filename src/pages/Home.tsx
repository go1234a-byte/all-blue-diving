import { useRole } from "@/contexts/RoleContext";
import Landing from "./Landing";

/**
 * "/" 진입점. 로그인 여부·역할과 무관하게 모두 동일한 리디자인 홈(Landing)을 본다.
 * 강사·관리자는 Landing 상단 nav의 "대시보드" 링크로 각자 콘솔(/instructor · /admin/home)에 들어간다.
 * (예전에는 로그인 시 Index 구버전 홈, 강사/관리자는 콘솔로 자동 리다이렉트했음 — 둘 다 제거.)
 */
export default function Home() {
  const { authLoading } = useRole();
  if (authLoading) return null;
  return <Landing />;
}
