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

const PAGE_TITLES: Record<string, string> = {
  "/admin/home": "홈",
  "/admin": "대시보드",
  "/admin/tours": "투어 관리",
  "/admin/bookings": "예약 관리",
  "/admin/payouts": "정산 관리",
  "/admin/instructors": "강사 관리",
  "/admin/centers": "센터 관리",
  "/admin/users": "회원 관리",
  "/admin/support": "문의 관리",
  "/admin/reports": "신고 관리",
  "/admin/notifications": "알림 관리",
  "/admin/notices": "공지 관리",
  "/admin/coupons": "쿠폰 관리",
  "/admin/analytics": "통계 분석",
  "/admin/settings": "시스템 설정",
  "/admin/manual": "운영 매뉴얼",
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
  const title = PAGE_TITLES[location.pathname] ?? "관리자 백오피스";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-card/95 px-4 backdrop-blur">
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

// 관리자 페이지도 다이버/강사 화면과 동일하게 모바일 하단 네비게이션(홈/대시보드/강사관리/회원관리/정산관리/더보기)으로
// 이동한다. 기존 좌측 사이드바(15개 메뉴)는 "더보기" 탭 안의 목록으로 정리했다.
export function AdminLayout() {
  return (
    <AdminPeriodProvider>
      <div className="min-h-full bg-gradient-surface pb-20">
        <AdminTopBar />
        <main className="mx-auto w-full max-w-md space-y-5 px-4 py-4 md:max-w-lg">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </AdminPeriodProvider>
  );
}
