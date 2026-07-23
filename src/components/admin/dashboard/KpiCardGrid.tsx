import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  CalendarX2,
  Compass,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import { KpiCard } from "@/components/admin/dashboard/KpiCard";
import { useAppData } from "@/contexts/AppDataContext";
import {
  computeBookingKpi,
  computeInstructorKpi,
  computeRevenueKpi,
  computeSettlementKpi,
  computeTodayDeparturesKpi,
  computeTodayEndingKpi,
  computeTodaySignupsKpi,
  computeTourKpi,
  computeUrgentAlertsKpi,
  formatKRW,
} from "@/lib/adminAnalytics";

export function KpiCardGrid() {
  const { bookings, tours, payouts, instructors, instructorProfiles, diverProfiles, reports, supportTickets } =
    useAppData();

  const bookingKpi = computeBookingKpi(bookings);
  const tourKpi = computeTourKpi(tours);
  const revenueKpi = computeRevenueKpi(bookings);
  const settlementKpi = computeSettlementKpi(payouts);
  const instructorKpi = computeInstructorKpi(instructors, instructorProfiles);
  const departuresKpi = computeTodayDeparturesKpi(tours, bookings);
  const endingKpi = computeTodayEndingKpi(tours, bookings);
  const alertsKpi = computeUrgentAlertsKpi(bookings, reports, supportTickets);
  const signupsKpi = computeTodaySignupsKpi(diverProfiles, instructorProfiles);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        title="오늘 가입자"
        icon={UserPlus}
        primaryValue={`${signupsKpi.total}명`}
        metrics={[
          { label: "다이버", value: `${signupsKpi.diverCount}명` },
          { label: "강사", value: `${signupsKpi.instructorCount}명` },
        ]}
        footerNote={signupsKpi.names.length > 0 ? signupsKpi.names.join(", ") : "오늘 가입한 회원이 없습니다"}
        to="/admin/users"
      />
      <KpiCard
        title="총 예약건수"
        icon={CalendarCheck}
        primaryValue={`${bookingKpi.total}건`}
        metrics={[
          { label: "예약 증감률", value: `${bookingKpi.changeRate >= 0 ? "+" : ""}${bookingKpi.changeRate}%` },
          { label: "오늘 예약건수", value: `${bookingKpi.todayCount}건` },
        ]}
        to="/admin/bookings"
      />
      <KpiCard
        title="진행중 투어"
        icon={Compass}
        primaryValue={`${tourKpi.inProgress}개`}
        metrics={[
          { label: "출발 예정", value: `${tourKpi.upcoming}개` },
          { label: "종료 예정", value: `${tourKpi.endingSoon}개` },
        ]}
        to="/admin/tours"
      />
      <KpiCard
        title="이번달 매출"
        icon={TrendingUp}
        primaryValue={formatKRW(revenueKpi.thisMonthRevenue)}
        metrics={[
          { label: "전월 매출", value: formatKRW(revenueKpi.prevMonthRevenue) },
          { label: "증감률", value: `${revenueKpi.changeRate >= 0 ? "+" : ""}${revenueKpi.changeRate}%` },
        ]}
        to="/admin/analytics"
      />
      <KpiCard
        title="정산 대기 금액"
        icon={Wallet}
        primaryValue={formatKRW(settlementKpi.pendingAmount)}
        metrics={[
          { label: "정산 건수", value: `${settlementKpi.pendingCount}건` },
          { label: "이번주 지급 예정", value: formatKRW(settlementKpi.scheduledAmount) },
        ]}
        to="/admin/payouts"
      />
      <KpiCard
        title="활동 강사 수"
        icon={ShieldCheck}
        primaryValue={`${instructorKpi.active}명`}
        metrics={[
          { label: "신규 강사", value: `${instructorKpi.newInstructors}명` },
          { label: "인증 대기", value: `${instructorKpi.pending}명` },
        ]}
        to="/admin/instructors"
      />
      <KpiCard
        title="오늘 출발 투어"
        icon={CalendarClock}
        primaryValue={`${departuresKpi.tourCount}개`}
        metrics={[{ label: "오늘 출발 참가자 수", value: `${departuresKpi.participantCount}명` }]}
        to="/admin/tours"
      />
      <KpiCard
        title="오늘 종료 투어"
        icon={CalendarX2}
        primaryValue={`${endingKpi.tourCount}개`}
        metrics={[{ label: "귀국 예정 참가자", value: `${endingKpi.participantCount}명` }]}
        to="/admin/tours"
      />
      <KpiCard
        title="긴급 알림"
        icon={AlertTriangle}
        primaryValue={`${alertsKpi.total}건`}
        metrics={[
          { label: "태풍/기상특보", value: `${alertsKpi.typhoonAlerts}건` },
          { label: "환불 급증", value: `${alertsKpi.refundSurge}건` },
          { label: "강사 인증 만료", value: `${alertsKpi.certExpiringSoon}건` },
          { label: "긴급 신고", value: `${alertsKpi.urgentReports}건` },
          { label: "미확인 문의", value: `${alertsKpi.unansweredInquiries}건` },
        ]}
        to="/admin/notifications"
        tone={alertsKpi.total > 0 ? "warning" : "default"}
      />
    </div>
  );
}
