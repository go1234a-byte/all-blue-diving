import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Compass,
  CalendarCheck,
  Wallet,
  Users,
  Building2,
  UserRound,
  MessageCircle,
  Flag,
  Bell,
  Megaphone,
  Ticket,
  BarChart3,
  Settings,
  BookOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/brand/Logo";

const MENU_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/tours", label: "투어 관리", icon: Compass, end: false },
  { to: "/admin/bookings", label: "예약 관리", icon: CalendarCheck, end: false },
  { to: "/admin/payouts", label: "정산 관리", icon: Wallet, end: false },
  { to: "/admin/instructors", label: "강사 관리", icon: Users, end: false },
  { to: "/admin/centers", label: "센터 관리", icon: Building2, end: false },
  { to: "/admin/users", label: "회원 관리", icon: UserRound, end: false },
  { to: "/admin/support", label: "문의 관리", icon: MessageCircle, end: false },
  { to: "/admin/reports", label: "신고 관리", icon: Flag, end: false },
  { to: "/admin/notifications", label: "알림 관리", icon: Bell, end: false },
  { to: "/admin/notices", label: "공지 관리", icon: Megaphone, end: false },
  { to: "/admin/coupons", label: "쿠폰 관리", icon: Ticket, end: false },
  { to: "/admin/analytics", label: "통계 분석", icon: BarChart3, end: false },
  { to: "/admin/settings", label: "시스템 설정", icon: Settings, end: false },
  { to: "/admin/manual", label: "운영 매뉴얼", icon: BookOpen, end: false },
];

export function AdminSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Logo size="sm" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild tooltip={item.label}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          isActive ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : ""
                        }
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
