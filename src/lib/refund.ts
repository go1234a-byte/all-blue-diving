import type { Tour } from "@/types";

/**
 * ALL BLUE 공식 취소 및 환불 규정 (본 파일이 유일한 소스):
 * - 출발 30일 전까지: 100% 환불 (출발 확정 전 · 60일 전 · 30일 전 구간을 통합)
 * - 출발 15일 전까지: 50% 환불
 * - 출발 7일 전까지: 30% 환불
 * - 출발 7일 미만 / 노쇼: 환불 불가 (0%)
 * - 의료·천재지변 등 불가피한 사유: 증빙서류 제출 후 운영팀 심사
 */
export const CANCELLATION_POLICY_LINES = [
  "• 출발 30일 전까지 : 100% 환불",
  "• 출발 15일 전까지 : 결제금액의 50% 환불",
  "• 출발 7일 전까지 : 결제금액의 30% 환불",
  "• 출발 7일 미만 : 환불 불가",
  "• 노쇼(No Show) : 환불 불가",
  "• 의료·천재지변 등 불가피한 사유 : 증빙서류 제출 후 운영팀 심사에 따라 환불 여부 결정",
];

export const CANCELLATION_POLICY_NOTE =
  "※ 카드 결제 취소 및 환불은 카드사 정책에 따라 실제 반영까지 영업일 기준 3~7일 정도 소요될 수 있습니다.";

export const FORCE_MAJEURE_REASON = "의료·천재지변 등 불가피한 사유" as const;
export const INSTRUCTOR_DISPUTE_REASON = "강사·투어사 사정" as const;

/** 오늘부터 투어 출발일까지 남은 일수 (음수 가능: 이미 지난 경우). */
export function computeDaysRemaining(startDateIso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDateIso);
  start.setHours(0, 0, 0, 0);
  return Math.round((start.getTime() - today.getTime()) / 86400000);
}

/**
 * 투어 상태와 잔여일수에 따른 환불율(0~1)을 계산한다.
 * - 출발 미확정(isConfirmed === false) 투어는 무조건 100% 환불.
 * - 출발 30일 전까지는 확정 여부와 무관하게 100% 환불.
 */
export function computeRefundRate(tour: Pick<Tour, "isConfirmed" | "startDate">): number {
  if (!tour.isConfirmed) return 1.0;

  const daysRemaining = computeDaysRemaining(tour.startDate);

  if (daysRemaining >= 30) return 1.0;
  if (daysRemaining >= 15) return 0.5;
  if (daysRemaining >= 7) return 0.3;
  return 0.0;
}

export function computeRefundAmount(totalPaid: number, refundRate: number): number {
  return Math.round(totalPaid * refundRate);
}

/** 출발 7일 미만 + 불가피한 사유 선택 시 즉시 환불 대신 운영팀 심사로 전환한다. */
export function isForceMajeureReviewCase(tour: Pick<Tour, "isConfirmed" | "startDate">, reason: string): boolean {
  if (!tour.isConfirmed) return false;
  const daysRemaining = computeDaysRemaining(tour.startDate);
  return daysRemaining < 7 && reason === FORCE_MAJEURE_REASON;
}

/**
 * 운영팀(관리자) 심사가 필요한 케이스인지 판단한다.
 * - 강사/투어사 귀책 사유로 인한 이의신청은 잔여일수와 무관하게 항상 증빙 심사 대상이다.
 * - 그 외에는 기존 불가항력(의료·천재지변) 7일 미만 규칙을 따른다.
 */
export function requiresAdminReview(tour: Pick<Tour, "isConfirmed" | "startDate">, reason: string): boolean {
  if (reason === INSTRUCTOR_DISPUTE_REASON) return true;
  return isForceMajeureReviewCase(tour, reason);
}
