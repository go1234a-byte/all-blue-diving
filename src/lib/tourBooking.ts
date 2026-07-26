import type { Tour } from "@/types";

/**
 * 이 투어를 지금 예약(또는 찜)할 수 있는 상태인지 여부.
 * - 관리자가 정지/보류 처리했거나 모집이 마감(최소 인원 미달로 취소된 경우 포함)된 투어는 false.
 * TourDetail의 예약 가능 여부 판단과 동일한 기준이며, 찜하기(위시리스트) 추가 가능 여부에도
 * 그대로 재사용한다 — 예약할 수 없는 투어를 위시리스트에 담아둘 이유가 없기 때문이다.
 */
export function isTourBookable(tour: Pick<Tour, "adminStatus" | "status">): boolean {
  return !tour.adminStatus && tour.status !== "closed";
}
