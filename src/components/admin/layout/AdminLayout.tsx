import { Outlet, useLocation } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { AdminPeriodProvider, useAdminPeriod, type AdminPeriod } from "@/contexts/AdminPeriodContext";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/tours": "투어 관리",
  "/admin/bookings": "예약 관리",
  "/admin/payouts": "정산 관리",
  "/admin/instructors": "강사 관리",
  "/admin/centers": "센터 관리",
  "/admin/users": "회원 관리",
  "/admin/support": "문의 관리",
  "/admin/reports": "신고 관리",
  "/admin/notifications": "알림 관리",
  "/admin/analytics": "통계 분석",
  "/admin/settings": "시스템 설정",
  "/admin/manual": "운영 매뉴얼",
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
  const title = PAGE_TITLES[location.pathname] ?? "관리자 백오피스";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>
      <Select value={period} onValueChange={(v) => setPeriod(v as AdminPeriod)}>
        <SelectTrigger className="h-8 w-32 text-xs">
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
      <div className="hidden items-center gap-2 sm:flex">
        <NotificationBell />
      </div>
    </header>
  );
}

export function AdminLayout() {
  return (
    <AdminPeriodProvider>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <AdminTopBar />
          <main className="flex-1 space-y-5 bg-gradient-surface p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AdminPeriodProvider>
  );
}
