import { AlertTriangle, CalendarClock, CalendarPlus, UserPlus } from "lucide-react";
import { KpiCard } from "@/components/admin/dashboard/KpiCard";
import { RecentActivityFeed } from "@/components/admin/dashboard/RecentActivityFeed";
import { useAppData } from "@/contexts/AppDataContext";
import {
  computeBookingKpi,
  computeTodayDeparturesKpi,
  computeTodaySignupsKpi,
  computeUrgentAlertsKpi,
} from "@/lib/adminAnalytics";

/**
 * 관리자 "홈" 탭 — 오늘 요약만 가볍게 보여준다.
 * 상세 지표/테이블/승인 큐 등은 전부 "대시보드" 탭(AdminDashboardPage, /admin)에 있다.
 */
const AdminHomePage = () => {
  const { bookings, tours, diverProfiles, instructorProfiles, reports, supportTickets } = useAppData();

  const signupsKpi = computeTodaySignupsKpi(diverProfiles, instructorProfiles);
  const bookingKpi = computeBookingKpi(bookings);
  const departuresKpi = computeTodayDeparturesKpi(tours, bookings);
  const alertsKpi = computeUrgentAlertsKpi(bookings, reports, supportTickets);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          title="오늘 가입자"
          icon={UserPlus}
          primaryValue={`${signupsKpi.total}명`}
          metrics={[
            { label: "다이버", value: `${signupsKpi.diverCount}명` },
            { label: "강사", value: `${signupsKpi.instructorCount}명` },
          ]}
          to="/admin/users"
        />
        <KpiCard
          title="오늘 예약"
          icon={CalendarPlus}
          primaryValue={`${bookingKpi.todayCount}건`}
          metrics={[{ label: "전체 누적 예약", value: `${bookingKpi.total}건` }]}
          to="/admin/bookings"
        />
        <KpiCard
          title="오늘 출발 투어"
          icon={CalendarClock}
          primaryValue={`${departuresKpi.tourCount}개`}
          metrics={[{ label: "참가자 수", value: `${departuresKpi.participantCount}명` }]}
          to="/admin/tours"
        />
        <KpiCard
          title="긴급 알림"
          icon={AlertTriangle}
          primaryValue={`${alertsKpi.total}건`}
          metrics={[{ label: "미확인 문의", value: `${alertsKpi.unansweredInquiries}건` }]}
          to="/admin/notifications"
          tone={alertsKpi.total > 0 ? "warning" : "default"}
        />
      </div>

      <RecentActivityFeed />
    </div>
  );
};

export default AdminHomePage;
