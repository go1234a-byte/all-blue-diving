export interface FavoriteBadge {
  label: string;
  /** closed = 마감(red), urgent = 임박·자리 남 핵심 숫자(primary), price = 보조 정보(neutral) */
  tone: "closed" | "urgent" | "seat" | "price";
}

/** 임박 기준: 남은 자리가 이 값 이하이면 "마감 임박" */
export const URGENT_SEAT_THRESHOLD = 3;
/** 가격 인하 배지를 유지하는 기간(일) */
export const PRICE_DROP_WINDOW_DAYS = 7;

/**
 * 찜한 투어 카드에 붙일 배지 하나를 고른다. 카드당 최대 하나.
 * 우선순위: 모집 마감 > 마감 임박 > 자리 남 > 가격 인하.
 *
 * - remaining = maxParticipants − confirmedCount (confirmedCount는 확정 인원 + 수동 인원, 정원 검증과 같은 기준)
 * - seatOpenedAt: 이 투어의 최근 seat_opened 알림 시각 (있으면 "자리 남", 현재 잔여석이 0보다 클 때만)
 * - priceDropAt: 이 투어의 최근 price_drop 알림 시각 (최근 PRICE_DROP_WINDOW_DAYS일 내일 때만)
 */
export function pickFavoriteBadge(input: {
  status: "open" | "closed";
  maxParticipants: number;
  confirmedCount: number;
  seatOpenedAt?: string;
  priceDropAt?: string;
  now?: number;
}): FavoriteBadge | null {
  const remaining = input.maxParticipants - input.confirmedCount;
  if (input.status === "closed" || remaining <= 0) return { label: "모집 마감", tone: "closed" };
  if (remaining <= URGENT_SEAT_THRESHOLD) return { label: `마감 임박 ${remaining}석`, tone: "urgent" };
  if (input.seatOpenedAt) return { label: `자리 남 ${remaining}석`, tone: "seat" };

  const now = input.now ?? Date.now();
  const windowMs = PRICE_DROP_WINDOW_DAYS * 86400000;
  if (input.priceDropAt && now - new Date(input.priceDropAt).getTime() <= windowMs) {
    return { label: "가격 인하", tone: "price" };
  }
  return null;
}
