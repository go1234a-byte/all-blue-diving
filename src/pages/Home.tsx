import Landing from "./Landing";

/**
 * "/" 진입점. 로그인 여부·역할과 무관하게 모두 동일한 리디자인 홈(Landing)을 본다.
 * 강사·관리자는 Landing 상단 nav의 "대시보드" 링크로 각자 콘솔(/instructor · /admin/home)에 들어간다.
 * (예전에는 로그인 시 Index 구버전 홈, 강사/관리자는 콘솔로 자동 리다이렉트했음 — 둘 다 제거.)
 *
 * 예전엔 로그인 확인(authLoading)이 끝날 때까지 빈 화면(null)을 그렸다. 홈 내용은 로그인과
 * 무관하므로 바로 그리고, 로그인 상태에 따라 달라지는 상단 메뉴만 Landing 안에서 확인 후에
 * 채운다 — 첫 화면(LCP)이 인증 왕복만큼 늦어지지 않는다.
 */
export default function Home() {
  return <Landing />;
}
