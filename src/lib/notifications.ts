import type { Booking, Tour } from "@/types";
import { MIN_PARTICIPANTS_AUTO_CANCEL_REASON } from "@/lib/tourAutoClose";

export type AlertLevel = "d3" | "d1" | "cancelled";

export interface TourAlert {
  id: string;
  tourId: string;
  bookingId: string;
  level: AlertLevel;
  title: string;
  message: string;
}

/** 자동취소 알림을 계속 노출할 기간(일). 이 기간이 지나면 알림 목록에서 사라진다. */
const AUTO_CANCEL_ALERT_WINDOW_DAYS = 14;

function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/**
 * 다이버의 확정 예약 중 투어 출발 D-3 / D-1에 해당하는 항목에 대해
 * 자동 알림 카드를 생성한다. (실제 OS 푸시 인프라 대신 인앱 알림센터로 구현)
 */
export function computeTourAlerts(tours: Tour[], bookings: Booking[], diverId: string): TourAlert[] {
  const myConfirmedBookings = bookings.filter(
    (b) => b.diverId === diverId && b.status === "confirmed" && b.depositStatus === "paid",
  );

  const alerts: TourAlert[] = [];

  for (const booking of myConfirmedBookings) {
    const tour = tours.find((t) => t.id === booking.tourId);
    if (!tour || tour.status !== "open") continue;

    const diff = daysUntil(tour.startDate);

    if (diff === 3) {
      alerts.push({
        id: `${booking.id}-d3`,
        tourId: tour.id,
        bookingId: booking.id,
        level: "d3",
        title: tour.title,
        message: "🚨 [ALL BLUE] 투어 출발 3일 전입니다! 포함/불포함 사항을 재확인하고 일정을 체크하세요.",
      });
    }

    if (diff === 1) {
      alerts.push({
        id: `${booking.id}-d1`,
        tourId: tour.id,
        bookingId: booking.id,
        level: "d1",
        title: tour.title,
        message: `🎒 [ALL BLUE] 내일 투어가 시작됩니다! 강사님이 등록한 [필수 준비물: ${
          tour.prepNotes || "미등록"
        }]을 잊지 말고 챙기셨는지 최종 점검하세요!`,
      });
    }
  }

  // 최소 인원 미달로 자동 취소된 예약: 취소 후 일정 기간 동안 안내 알림을 노출한다.
  const myAutoCancelledBookings = bookings.filter(
    (b) =>
      b.diverId === diverId &&
      b.status === "cancelled" &&
      b.cancelReason === MIN_PARTICIPANTS_AUTO_CANCEL_REASON &&
      b.cancelRequestedAt,
  );

  for (const booking of myAutoCancelledBookings) {
    const tour = tours.find((t) => t.id === booking.tourId);
    if (!tour || !booking.cancelRequestedAt) continue;

    const daysSince = Math.round(
      (Date.now() - new Date(booking.cancelRequestedAt).getTime()) / 86400000,
    );
    if (daysSince > AUTO_CANCEL_ALERT_WINDOW_DAYS) continue;

    alerts.push({
      id: `${booking.id}-auto-cancel`,
      tourId: tour.id,
      bookingId: booking.id,
      level: "cancelled",
      title: tour.title,
      message: `😢 [ALL BLUE] 최소 인원 미달로 투어가 취소되었습니다. 결제하신 금액은 전액(100%) 환불 처리됩니다.`,
    });
  }

  return alerts;
}
