import { Link } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Bell,
  Building2,
  CalendarCheck,
  ChevronRight,
  Compass,
  Flag,
  Megaphone,
  MessageCircle,
  Settings,
  Ticket,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AccountActions } from "@/components/mypage/AccountActions";

// 하단 바로가기(홈/대시보드/강사관리/회원관리/정산관리)에 들어가지 못한 나머지 관리 메뉴를 여기 모아둔다.
const MORE_ITEMS = [
  { to: "/admin/tours", label: "투어 관리", icon: Compass },
  { to: "/admin/bookings", label: "예약 관리", icon: CalendarCheck },
  { to: "/admin/centers", label: "센터 관리", icon: Building2 },
  { to: "/admin/support", label: "문의 관리", icon: MessageCircle },
  { to: "/admin/reports", label: "신고 관리", icon: Flag },
  { to: "/admin/notifications", label: "알림 관리", icon: Bell },
  { to: "/admin/notices", label: "공지 관리", icon: Megaphone },
  { to: "/admin/coupons", label: "쿠폰 관리", icon: Ticket },
  { to: "/admin/analytics", label: "통계 분석", icon: BarChart3 },
  { to: "/admin/settings", label: "시스템 설정", icon: Settings },
  { to: "/admin/manual", label: "운영 매뉴얼", icon: BookOpen },
];

const AdminMorePage = () => {
  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {MORE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/40"
              >
                <Icon className="h-4 w-4 text-primary" />
                <span className="flex-1">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })}
        </CardContent>
      </Card>

      <AccountActions />
    </div>
  );
};

export default AdminMorePage;
