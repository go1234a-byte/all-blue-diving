import type { ActivityType } from "@/types";

/** tour_diver_notifications.kind — 트리거/일일 Cron이 넣는 알림 종류 */
export type DiverNotificationKind =
  | "booking_changed"
  | "new_tour"
  | "deadline_d7"
  | "deadline_d1"
  | "price_drop"
  | "seats_low"
  | "seat_opened";

export interface DiverNotification {
  id: string;
  tourId: string;
  kind: DiverNotificationKind;
  title: string;
  body: string;
  url: string;
  createdAt: string;
}

/** tour_alert_subscriptions — 지역·월·액티비티 조건의 새 투어 알림. months 1~12, 빈 배열 = 상관없음 */
export interface TourAlertSubscription {
  id: string;
  country: string;
  months: number[];
  activityTypes: ActivityType[];
  enabled: boolean;
  createdAt: string;
}

export interface TourAlertSubscriptionInput {
  country: string;
  months: number[];
  activityTypes: ActivityType[];
}

/** 구독은 한 다이버당 최대 10개 (DB 트리거 tour_alert_subscriptions_cap과 같은 값) */
export const MAX_TOUR_ALERT_SUBSCRIPTIONS = 10;
