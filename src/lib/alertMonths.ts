import { monthKey, monthOfKey } from "@/lib/dates";

/**
 * 알림 구독의 월 변환은 이 파일에서만 한다.
 * - 화면 MonthMultiSelect는 monthKey(연도*12 + 월0) 값을 쓴다.
 * - DB tour_alert_subscriptions.months와 트리거의 extract(month from start_date)는 1~12 월 번호를 쓴다.
 * - diveSeasons.ts의 월 인덱스(0~11)는 추천 카드 전용이라, 구독으로 넘길 때 여기서 monthKey로 바꾼다.
 */

/** 화면의 monthKey 목록 → DB용 월 번호(1~12). 연도는 버리고 중복은 합친다. */
export function toSubscriptionMonths(monthKeys: number[]): number[] {
  return [...new Set(monthKeys.map((k) => monthOfKey(k) + 1))].sort((a, b) => a - b);
}

/** 0~11 월 인덱스(추천 카드)를 가장 가까운 다음 해당 월의 monthKey로 바꾼다. 지난 달이면 내년. */
export function nextMonthKeyFromIndex(month0: number, now: Date = new Date()): number {
  const year = now.getFullYear() + (month0 < now.getMonth() ? 1 : 0);
  return monthKey(year, month0);
}
