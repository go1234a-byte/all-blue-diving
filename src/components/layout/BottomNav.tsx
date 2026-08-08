import { NavLink } from "react-router-dom";
import {
  Home,
  CalendarCheck,
  Heart,
  MessageCircle,
  UserRound,
  LayoutDashboard,
  Users,
  Calculator,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  end: boolean;
  state?: { instructorBrowsing: boolean };
}

const DIVER_NAV_ITEMS: NavItem[] = [
  { to: "/", label: "홈", icon: Home, end: true },
  { to: "/my-bookings", label: "내 예약", icon: CalendarCheck, end: false },
  { to: "/chat", label: "채팅", icon: MessageCircle, end: false },
  { to: "/favorites", label: "위시리스트", icon: Heart, end: false },
  { to: "/mypage", label: "마이페이지", icon: UserRound, end: false },
];

// 강사는 "/"(공개 투어 홈)가 아니라 "/instructor"(강사 콘솔 대시보드)가 실질적인 홈이다.
// 예약/찜하기는 다이버 전용 개념이라 대신 투어 생성으로 대체한다.
// "투어 홈"은 Index.tsx의 역할 기반 자동 리다이렉트(강사 → /instructor) 대상 경로와 동일한 "/"를
// 가리키므로, 강사가 직접 눌러 이동했다는 것을 state로 표시해 Index.tsx가 리다이렉트를 건너뛰게 한다.
const INSTRUCTOR_NAV_ITEMS: NavItem[] = [
  { to: "/", label: "투어 홈", icon: Home, end: true, state: { instructorBrowsing: true } },
  { to: "/instructor", label: "대시보드", icon: LayoutDashboard, end: true },
  { to: "/chat", label: "채팅", icon: MessageCircle, end: false },
  { to: "/mypage", label: "마이페이지", icon: UserRound, end: false },
];

// 관리자는 좌측 사이드바(15개 메뉴) 대신 핵심 4개 + 더보기로 구성한다.
// 예전에는 "홈"(오늘 요약)과 "대시보드"(상세 지표)가 따로 있었는데, 지표가 대부분 겹쳐서
// 두 화면이 거의 똑같아 보이는 문제가 있었다 — "홈" 하나로 합치고(AdminHomePage가
// AdminDashboardPage를 그대로 재사용), "정산관리" 대신 사용 빈도가 높은 "회계관리"를
// 핵심 메뉴로 승격했다. 정산관리(개별 건별 승인/보류)는 더보기로 이동했다.
const ADMIN_NAV_ITEMS: NavItem[] = [
  { to: "/admin/home", label: "홈", icon: Home, end: true },
  { to: "/admin/instructors", label: "강사관리", icon: Users, end: false },
  { to: "/admin/users", label: "회원관리", icon: UserRound, end: false },
  { to: "/admin/accounting", label: "회계관리", icon: Calculator, end: false },
  { to: "/admin/more", label: "더보기", icon: MoreHorizontal, end: false },
];

const GRID_COLS_CLASS: Record<number, string> = {
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

export function BottomNav() {
  const { role } = useRole();
  const NAV_ITEMS =
    role === "admin" ? ADMIN_NAV_ITEMS : role === "instructor" ? INSTRUCTOR_NAV_ITEMS : DIVER_NAV_ITEMS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-border bg-card/95 backdrop-blur md:max-w-lg">
      <div className={cn("grid", GRID_COLS_CLASS[NAV_ITEMS.length] ?? "grid-cols-4")}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              state={item.state}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
