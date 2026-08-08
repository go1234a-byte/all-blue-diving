import { Outlet, useLocation } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BottomNav } from "@/components/layout/BottomNav";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AdminPeriodProvider, useAdminPeriod, type AdminPeriod } from "@/contexts/AdminPeriodContext";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

const PAGE_TITLES: Record<string, string> = {
  "/admin/home": "홈",
  "/admin": "대시보드",
  "/admin/tours": "투어 관리",
  "/admin/bookings": "예약 관리",
  "/admin/payouts": "정산 관리",
  "/admin/accounting": "회계 센터",
  "/admin/instructors": "강사 관리",
  "/admin/centers": "센터 관리",
  "/admin/users": "회원 관리",
  "/admin/support": "문의 관리",
  "/admin/reports": "신고 관리",
  "/admin/notifications": "알림 관리",
  "/admin/activity": "전체 알림",
  "/admin/notices": "공지 관리",
  "/admin/coupons": "쿠폰 관리",
  "/admin/analytics": "통계 분석",
  "/admin/settings": "시스템 설정",
  "/admin/manual": "운영 매뉴얼",
  "/admin/qa-checklist": "QA 체크리스트",
  "/admin/more": "더보기",
};

const PERIOD_LABEL: Record<AdminPeriod, string> = {
  today: "오늘",
  week: "이번주",
  month: "이번달",
  year: "올해",
  custom: "직접 선택",
};

function AdminTopBar() {
  const location = useLocation();
  const { period, setPeriod } = useAdminPeriod();
  const title =
    PAGE_TITLES[location.pathname] ??
    (location.pathname.startsWith("/admin/users/") ? "회원 상세" : "관리자 백오피스");

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-card/95 px-4 backdrop-blur md:px-6">
      <h1 className="line-clamp-1 text-base font-semibold text-foreground">{title}</h1>
      <div className="flex shrink-0 items-center gap-2">
        <Select value={period} onValueChange={(v) => setPeriod(v as AdminPeriod)}>
          <SelectTrigger className="h-8 w-[92px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PERIOD_LABEL) as AdminPeriod[]).map((key) => (
              <SelectItem key={key} value={key}>
                {PERIOD_LABEL[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <NotificationBell />
      </div>
    </header>
  );
}

/**
 * 관리자 레이아웃 — 화면 폭에 따라 두 가지 형태로 전환한다.
 * · 데스크톱(md 이상, 768px~): 좌측 고정 사이드바(전체 메뉴) + 상단바 + 콘텐츠.
 *   시안(관리자 웹 대시보드)에서 요청한 레이아웃이자, 원래 이 프로젝트에 있었던
 *   AdminSidebar를 그대로 재사용한다(그동안 사용되지 않고 있었음).
 * · 모바일(768px 미만): 기존처럼 상단바 + 하단 탭 네비게이션.
 * Outlet(실제 페이지)은 항상 한쪽에서만 렌더링되어 중복 마운트/중복 데이터 로딩이 없다.
 */
export function AdminLayout() {
  const isMobile = useIsMobile();

  return (
    <AdminPeriodProvider>
      {/* 소비자 앱은 딥네이비 기본 테마로 바뀌었지만, 운영자용 관리자 화면은
          데이터를 오래 들여다보는 화면 특성상 기존처럼 밝은 화면을 유지한다. */}
      <div className="admin-light min-h-full bg-gradient-surface">
        {isMobile ? (
          <div className="pb-20">
            <AdminTopBar />
            <main className="mx-auto w-full max-w-md space-y-5 px-4 py-4 md:max-w-lg">
              <Outlet />
            </main>
            <BottomNav />
          </div>
        ) : (
          <SidebarProvider>
            <AdminSidebar />
            <SidebarInset>
              <AdminTopBar />
              <main className="flex-1 space-y-5 p-6 lg:p-8">
                <Outlet />
              </main>
            </SidebarInset>
          </SidebarProvider>
        )}
      </div>
    </AdminPeriodProvider>
  );
}
