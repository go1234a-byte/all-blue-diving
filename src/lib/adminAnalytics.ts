import type { Booking, InstructorProfile, Payout, Profile, Report, SupportTicket, Tour } from "@/types";
import { formatKRW } from "@/lib/pricing";

/** 오늘(자정 기준) ISO 날짜 문자열. */
function todayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function isSameDate(iso: string, targetIso: string): boolean {
  return iso.slice(0, 10) === targetIso;
}

function isWithinLastNDays(iso: string, days: number): boolean {
  return new Date(iso).getTime() >= new Date(daysAgoISO(days)).getTime();
}

export type PeriodKey = "today" | "week" | "month" | "year" | "custom";

export interface KpiChangeResult {
  value: number;
  changeRate: number; // percent, e.g. 12.5 means +12.5%
}

function computeChangeRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** 카드 1: 총 예약건수 / 증감률 / 오늘 예약건수 */
export function computeBookingKpi(bookings: Booking[]) {
  const total = bookings.length;
  const today = todayISO();
  const todayCount = bookings.filter((b) => isSameDate(b.createdAt, today)).length;

  const last30 = bookings.filter((b) => isWithinLastNDays(b.createdAt, 30)).length;
  const prev30 = bookings.filter(
    (b) => !isWithinLastNDays(b.createdAt, 30) && isWithinLastNDays(b.createdAt, 60),
  ).length;
  const changeRate = computeChangeRate(last30, prev30);

  return { total, todayCount, changeRate };
}

/** 카드 2: 진행중 투어 / 출발 예정 / 종료 예정 */
export function computeTourKpi(tours: Tour[]) {
  const today = todayISO();
  const inProgress = tours.filter(
    (t) => t.status === "open" && t.startDate <= today && t.endDate >= today,
  ).length;
  const upcoming = tours.filter((t) => t.status === "open" && t.startDate > today).length;
  const endingSoon = tours.filter((t) => t.endDate >= today && t.endDate <= daysFromNowISO(7)).length;

  return { inProgress, upcoming, endingSoon };
}

function daysFromNowISO(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 카드 3: 이번달 매출 / 전월 대비 증감률 */
export function computeRevenueKpi(bookings: Booking[]) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const prevMonthDate = new Date(thisYear, thisMonth - 1, 1);

  const thisMonthRevenue = bookings
    .filter((b) => {
      const d = new Date(b.createdAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    })
    .reduce((sum, b) => sum + b.platformFee, 0);

  const prevMonthRevenue = bookings
    .filter((b) => {
      const d = new Date(b.createdAt);
      return d.getMonth() === prevMonthDate.getMonth() && d.getFullYear() === prevMonthDate.getFullYear();
    })
    .reduce((sum, b) => sum + b.platformFee, 0);

  const changeRate = computeChangeRate(thisMonthRevenue, prevMonthRevenue);

  return { thisMonthRevenue, prevMonthRevenue, changeRate };
}

/** 카드 4: 정산 대기 금액 / 정산 건수 / 이번주 지급 예정 */
export function computeSettlementKpi(payouts: Payout[]) {
  const pending = payouts.filter((p) => p.status === "scheduled" || p.status === "held");
  const pendingAmount = pending.reduce((sum, p) => sum + p.firstAmount + p.secondAmount, 0);
  const scheduledThisWeek = payouts.filter((p) => p.status === "scheduled");
  const scheduledAmount = scheduledThisWeek.reduce((sum, p) => sum + p.firstAmount + p.secondAmount, 0);

  return { pendingAmount, pendingCount: pending.length, scheduledAmount, scheduledCount: scheduledThisWeek.length };
}

/** 카드: 오늘 가입자 수 (다이버 + 강사 합산) */
export function computeTodaySignupsKpi(diverProfiles: Profile[], instructorProfiles: Profile[]) {
  const today = todayISO();
  const diverCount = diverProfiles.filter((p) => isSameDate(p.createdAt, today)).length;
  const instructorCount = instructorProfiles.filter((p) => isSameDate(p.createdAt, today)).length;

  return { total: diverCount + instructorCount, diverCount, instructorCount };
}

/** 카드 5: 활동 강사 수 / 신규 강사 / 인증 대기 */
export function computeInstructorKpi(instructors: InstructorProfile[], instructorProfiles: Profile[]) {
  const active = instructors.filter((i) => i.verified).length;
  const pending = instructors.filter((i) => !i.verified).length;
  const newInstructors = instructorProfiles.filter((p) => isWithinLastNDays(p.createdAt, 30)).length;

  return { active, pending, newInstructors };
}

/** 카드 6: 오늘 출발 투어 / 오늘 출발 참가자 수 */
export function computeTodayDeparturesKpi(tours: Tour[], bookings: Booking[]) {
  const today = todayISO();
  const departingTours = tours.filter((t) => isSameDate(t.startDate, today));
  const departingTourIds = new Set(departingTours.map((t) => t.id));
  const participantCount = bookings.filter(
    (b) => departingTourIds.has(b.tourId) && b.status === "confirmed",
  ).length;

  return { tourCount: departingTours.length, participantCount };
}

/** 카드 7: 오늘 종료 투어 / 귀국 예정 참가자 */
export function computeTodayEndingKpi(tours: Tour[], bookings: Booking[]) {
  const today = todayISO();
  const endingTours = tours.filter((t) => isSameDate(t.endDate, today));
  const endingTourIds = new Set(endingTours.map((t) => t.id));
  const participantCount = bookings.filter(
    (b) => endingTourIds.has(b.tourId) && b.status === "confirmed",
  ).length;

  return { tourCount: endingTours.length, participantCount };
}

/** 카드 8: 긴급 알림 — 태풍/기상특보(0 고정), 환불급증, 강사인증만료(0 고정), 긴급신고, 미확인문의 */
export function computeUrgentAlertsKpi(
  bookings: Booking[],
  reports: Report[],
  supportTickets: SupportTicket[],
) {
  const typhoonAlerts = 0; // 실제 기상 API 연동 없음 — 구조만 준비
  const certExpiringSoon = 0; // 강사 인증 만료 필드 없음 — 구조만 준비
  const refundSurge = bookings.filter(
    (b) =>
      (b.status === "cancelled" || b.status === "cancel_pending_review") &&
      b.cancelRequestedAt &&
      isWithinLastNDays(b.cancelRequestedAt, 7),
  ).length;
  const urgentReports = reports.filter((r) => r.status === "pending").length;
  const unansweredInquiries = supportTickets.filter((t) => t.status === "접수").length;

  const total = typhoonAlerts + certExpiringSoon + refundSurge + urgentReports + unansweredInquiries;

  return { typhoonAlerts, certExpiringSoon, refundSurge, urgentReports, unansweredInquiries, total };
}

export type BookingStatusBucket = "확정" | "진행중" | "완료" | "취소" | "대기";

/** 예약 현황 도넛차트: 확정/진행중/완료/취소/대기 */
export function computeBookingStatusBreakdown(bookings: Booking[], tours: Tour[]) {
  const today = todayISO();
  const tourById = new Map(tours.map((t) => [t.id, t]));
  const buckets: Record<BookingStatusBucket, number> = {
    확정: 0,
    진행중: 0,
    완료: 0,
    취소: 0,
    대기: 0,
  };

  for (const b of bookings) {
    if (b.status === "cancelled") {
      buckets.취소 += 1;
      continue;
    }
    if (b.status === "cancel_pending_review") {
      buckets.대기 += 1;
      continue;
    }
    const tour = tourById.get(b.tourId);
    if (tour) {
      if (tour.startDate <= today && tour.endDate >= today) {
        buckets.진행중 += 1;
        continue;
      }
      if (tour.endDate < today) {
        buckets.완료 += 1;
        continue;
      }
    }
    buckets.확정 += 1;
  }

  return (Object.keys(buckets) as BookingStatusBucket[]).map((key) => ({
    name: key,
    value: buckets[key],
  }));
}

/** 국가별 예약 현황 막대그래프 */
export function computeCountryBookingStats(bookings: Booking[], tours: Tour[]) {
  const tourById = new Map(tours.map((t) => [t.id, t]));
  const counts = new Map<string, number>();

  for (const b of bookings) {
    const tour = tourById.get(b.tourId);
    if (!tour) continue;
    counts.set(tour.country, (counts.get(tour.country) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);
}

export type RevenueGranularity = "day" | "week" | "month" | "quarter" | "year";

function bucketKeyFor(date: Date, granularity: RevenueGranularity): string {
  const y = date.getFullYear();
  const m = date.getMonth();
  switch (granularity) {
    case "day":
      return date.toISOString().slice(0, 10);
    case "week": {
      const firstDay = new Date(date);
      firstDay.setDate(date.getDate() - date.getDay());
      return firstDay.toISOString().slice(0, 10);
    }
    case "month":
      return `${y}-${String(m + 1).padStart(2, "0")}`;
    case "quarter":
      return `${y}-Q${Math.floor(m / 3) + 1}`;
    case "year":
      return `${y}`;
  }
}

/** 매출 분석 라인차트: 총매출 / 정산금 / 수수료 시계열 */
export function computeRevenueSeries(bookings: Booking[], granularity: RevenueGranularity = "month") {
  const buckets = new Map<string, { total: number; settlement: number; fee: number }>();

  for (const b of bookings) {
    const key = bucketKeyFor(new Date(b.createdAt), granularity);
    const entry = buckets.get(key) ?? { total: 0, settlement: 0, fee: 0 };
    entry.total += b.totalPaid;
    entry.settlement += b.basePrice + b.optionsCost;
    entry.fee += b.platformFee;
    buckets.set(key, entry);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([period, v]) => ({ period, 총매출: v.total, 정산금: v.settlement, 수수료: v.fee }));
}

/** 활동률이 낮은 강사: 최근 등록 투어 수 기준 하위 */
export function computeLowActivityInstructors(instructors: InstructorProfile[], tours: Tour[]) {
  const tourCountByInstructor = new Map<string, number>();
  for (const t of tours) {
    tourCountByInstructor.set(t.instructorId, (tourCountByInstructor.get(t.instructorId) ?? 0) + 1);
  }

  return instructors
    .map((i) => ({ instructor: i, tourCount: tourCountByInstructor.get(i.id) ?? 0 }))
    .sort((a, b) => a.tourCount - b.tourCount)
    .slice(0, 5);
}

/** 예약률이 높은 인기 국가 Top N */
export function computePopularCountries(bookings: Booking[], tours: Tour[], topN = 5) {
  return computeCountryBookingStats(bookings, tours).slice(0, topN);
}

/** 최근 생성된 신규 투어 */
export function computeRecentTours(tours: Tour[], limit = 5) {
  // MOCK_TOURS는 생성일 필드가 없으므로 id 역순(최근 추가된 것이 배열 앞쪽에 prepend됨)으로 근사
  return tours.slice(0, limit);
}

/** 최근 가입한 신규 회원 */
export function computeRecentMembers(diverProfiles: Profile[], instructorProfiles: Profile[], limit = 5) {
  return [...diverProfiles, ...instructorProfiles]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);
}

export { formatKRW };
