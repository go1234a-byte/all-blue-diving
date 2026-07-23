import { NavLink } from "react-router-dom";
import {
  Home,
  CalendarCheck,
  Heart,
  MessageCircle,
  UserRound,
  LayoutDashboard,
  Users,
  Wallet,
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
  { to: "/favorites", label: "찜한 투어", icon: Heart, end: false },
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

// 관리자는 좌측 사이드바(15개 메뉴) 대신 핵심 5개 + 더보기로 구성한다.
// "홈"은 오늘 요약, "대시보드"는 기존 상세 지표 페이지(/admin) 그대로다.
const ADMIN_NAV_ITEMS: NavItem[] = [
  { to: "/admin/home", label: "홈", icon: Home, end: true },
  { to: "/admin", label: "대시보드", icon: LayoutDashboard, end: true },
  { to: "/admin/instructors", label: "강사관리", icon: Users, end: false },
  { to: "/admin/users", label: "회원관리", icon: UserRound, end: false },
  { to: "/admin/payouts", label: "정산관리", icon: Wallet, end: false },
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
