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
  BarChart3,
  Settings,
  BookOpen,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TelemetryCards } from "@/components/admin/TelemetryCards";
import { CancellationReviewQueue } from "@/components/admin/CancellationReviewQueue";
import { AccountActions } from "@/components/mypage/AccountActions";
import { PushNotificationToggle } from "@/components/mypage/PushNotificationToggle";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminToursPage from "@/pages/admin/AdminToursPage";
import AdminBookingsPage from "@/pages/admin/AdminBookingsPage";
import AdminPayoutsPage from "@/pages/admin/AdminPayoutsPage";
import AdminInstructorsPage from "@/pages/admin/AdminInstructorsPage";
import AdminCentersPage from "@/pages/admin/AdminCentersPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminSupportPage from "@/pages/admin/AdminSupportPage";
import AdminReportsPage from "@/pages/admin/AdminReportsPage";
import AdminNotificationsPage from "@/pages/admin/AdminNotificationsPage";
import AdminAnalyticsPage from "@/pages/admin/AdminAnalyticsPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminManualPage from "@/pages/admin/AdminManualPage";

const SECTIONS = [
  { value: "dashboard", label: "대시보드", icon: LayoutDashboard, content: <AdminDashboardPage /> },
  { value: "tours", label: "투어 관리", icon: Compass, content: <AdminToursPage /> },
  {
    value: "bookings",
    label: "예약 관리",
    icon: CalendarCheck,
    content: (
      <div className="space-y-4">
        <CancellationReviewQueue />
        <AdminBookingsPage />
      </div>
    ),
  },
  { value: "payouts", label: "정산 관리", icon: Wallet, content: <AdminPayoutsPage /> },
  { value: "instructors", label: "강사 관리", icon: Users, content: <AdminInstructorsPage /> },
  { value: "centers", label: "센터 관리", icon: Building2, content: <AdminCentersPage /> },
  { value: "users", label: "회원 관리", icon: UserRound, content: <AdminUsersPage /> },
  { value: "support", label: "문의 관리", icon: MessageCircle, content: <AdminSupportPage /> },
  { value: "reports", label: "신고 관리", icon: Flag, content: <AdminReportsPage /> },
  { value: "notifications", label: "알림 관리", icon: Bell, content: <AdminNotificationsPage /> },
  { value: "analytics", label: "통계 분석", icon: BarChart3, content: <AdminAnalyticsPage /> },
  { value: "settings", label: "시스템 설정", icon: Settings, content: <AdminSettingsPage /> },
  { value: "manual", label: "운영 매뉴얼", icon: BookOpen, content: <AdminManualPage /> },
];

export function AdminMyPageView() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">백오피스 요약</h3>
        <TelemetryCards />
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <AccordionItem
              key={section.value}
              value={section.value}
              className="rounded-xl border border-border bg-card px-3"
            >
              <AccordionTrigger className="py-3 text-sm font-semibold text-foreground hover:no-underline">
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  {section.label}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1">{section.content}</AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <PushNotificationToggle />

      <AccountActions />
    </div>
  );
}
