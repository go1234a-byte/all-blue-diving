import { NavLink } from "react-router-dom";
import { Home, CalendarCheck, Heart, MessageCircle, UserRound, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";

const DIVER_NAV_ITEMS = [
  { to: "/", label: "홈", icon: Home, end: true },
  { to: "/my-bookings", label: "내 예약", icon: CalendarCheck, end: false },
  { to: "/chat", label: "채팅", icon: MessageCircle, end: false },
  { to: "/favorites", label: "찜한 투어", icon: Heart, end: false },
  { to: "/mypage", label: "마이페이지", icon: UserRound, end: false },
];

// 강사는 "/"(공개 투어 홈)가 아니라 "/instructor"(강사 콘솔 대시보드)가 실질적인 홈이다.
// 예약/찜하기는 다이버 전용 개념이라 대신 투어 생성으로 대체한다.
const INSTRUCTOR_NAV_ITEMS = [
  { to: "/instructor", label: "대시보드", icon: LayoutDashboard, end: true },
  { to: "/", label: "투어 홈", icon: Home, end: true },
  { to: "/chat", label: "채팅", icon: MessageCircle, end: false },
  { to: "/mypage", label: "마이페이지", icon: UserRound, end: false },
];

export function BottomNav() {
  const { role } = useRole();
  const NAV_ITEMS = role === "instructor" ? INSTRUCTOR_NAV_ITEMS : DIVER_NAV_ITEMS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-border bg-card/95 backdrop-blur md:max-w-lg">
      <div className={cn("grid", NAV_ITEMS.length === 5 ? "grid-cols-5" : "grid-cols-4")}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
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
