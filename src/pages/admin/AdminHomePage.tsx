import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";

/**
 * 관리자 "홈" 탭 (로그인 시 랜딩 화면, /admin/home).
 * 예전에는 오늘 요약(KPI 4개)만 보여주는 별도의 축소판 화면이었는데, "대시보드"
 * 탭(/admin, AdminDashboardPage)과 지표가 대부분 겹쳐서 두 화면이 거의 똑같아 보이는
 * 문제가 있었다. 이제는 별도 화면을 만들지 않고 대시보드 화면을 그대로 재사용해서
 * 하나로 합친다 — 하단 네비게이션에서도 "대시보드" 항목은 제거되었다.
 */
const AdminHomePage = () => <AdminDashboardPage />;

export default AdminHomePage;
