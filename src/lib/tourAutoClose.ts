import { RECRUITMENT_AUTO_CLOSE_DAYS_BEFORE_START } from "@/types";
import type { Tour } from "@/types";

/**
 * 최소 인원 자동 마감 정책 (본 파일이 유일한 소스):
 * - 투어 출발일 30일 전, 모집을 자동으로 마감한다.
 * - 그 시점의 확정 예약 수가 강사가 설정한 min_participants(최소 인원) 이상이면
 *   모집만 마감하고 투어는 그대로 진행한다.
 * - 최소 인원 미달인 경우, 강사가 투어 생성 시 설정한 under_min_policy에 따라:
 *   - "proceed"(그대로 진행): 모집만 마감, 투어는 진행 (책임은 강사 전자서약에 명시된 대로 강사 본인).
 *   - "cancel"(투어 취소): 투어를 "출발 미확정" 상태로 전환해 취소하고, 기존 취소/환불 규정의
 *     "출발 확정 전 = 100% 환불" 규정을 그대로 적용해 전액 환불한다 (별도 예외 규정 없음).
 */

/** 자동 마감 기준일(투어 출발일 - 30일)을 반환한다. */
export function getAutoCloseDate(tour: Pick<Tour, "startDate">): Date {
  const start = new Date(tour.startDate);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - RECRUITMENT_AUTO_CLOSE_DAYS_BEFORE_START);
  return start;
}

/** 오늘이 자동 마감 기준일을 지났는지 여부. */
export function isPastAutoCloseDate(tour: Pick<Tour, "startDate">): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime() >= getAutoCloseDate(tour).getTime();
}

/**
 * 특정 투어가 지금 자동 마감 평가 대상인지 판단한다.
 * - 이미 처리된 투어(autoCloseProcessed)나 이미 마감된 투어는 대상에서 제외한다.
 */
export function shouldEvaluateAutoClose(
  tour: Pick<Tour, "startDate" | "status" | "autoCloseProcessed" | "adminStatus">,
): boolean {
  if (tour.status !== "open") return false;
  if (tour.autoCloseProcessed) return false;
  if (tour.adminStatus) return false; // 관리자 정지/보류 중인 투어는 자동 마감 평가에서 제외
  return isPastAutoCloseDate(tour);
}

export const MIN_PARTICIPANTS_AUTO_CANCEL_REASON =
  "최소 인원 미달로 인한 투어 자동 취소 (강사 설정 정책에 따름)";
