import type { Tour } from "@/types";

/** 남은 자리 (정원 − 확정 인원, 음수 방지). */
export function seatsLeft(t: Pick<Tour, "maxParticipants">, joined: number): number {
  return Math.max(0, t.maxParticipants - joined);
}

/** 이 인원 이하면 "N자리 남음"으로 강조한다. */
export const FEW_SEATS = 3;

export type SeatState = "full" | "few" | "ok";
export function seatState(t: Pick<Tour, "maxParticipants">, joined: number): SeatState {
  const left = seatsLeft(t, joined);
  if (left === 0) return "full";
  return left <= FEW_SEATS ? "few" : "ok";
}

/** 후기가 한 개 이상일 때만 별점 문구를 만든다(0.0 별점은 "평가가 나쁜 투어"로 읽힌다). */
export function ratingText(ratings: number[]): { avg: string; count: number } | null {
  if (ratings.length === 0) return null;
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return { avg: avg.toFixed(1), count: ratings.length };
}

/** 출발까지 남은 일수 라벨("D-26", 당일 "D-DAY", 지난 날짜는 null). */
export function dDayLabel(daysRemaining: number): string | null {
  if (daysRemaining < 0) return null;
  return daysRemaining === 0 ? "D-DAY" : `D-${daysRemaining}`;
}

/** 만원 단위 짧은 가격("₩328만~"). 칩·정렬 탭처럼 좁은 곳에서만 쓰고, 카드·상세는 formatKRW 전체 금액을 쓴다. */
export function shortPrice(won: number): string {
  if (won >= 10_000) return `₩${Math.round(won / 10_000).toLocaleString("ko-KR")}만`;
  return `₩${won.toLocaleString("ko-KR")}`;
}

/** 나라별 최저가(표시 가격 기준). 가격 계산은 호출한 쪽이 넘긴 fee 함수를 쓴다. */
export function minPriceByCountry(
  tours: Array<Pick<Tour, "country" | "basePrice">>,
  withFee: (basePrice: number) => number,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of tours) {
    if (!t.country) continue;
    const p = withFee(t.basePrice);
    if (out[t.country] === undefined || p < out[t.country]) out[t.country] = p;
  }
  return out;
}

/** 카드용 환불 한 줄. 전액이면 기한, 일부면 지금 비율, 아니면 불가. */
export function refundLine(daysRemaining: number): string {
  if (daysRemaining >= 30) return daysRemaining === 30 ? "출발 30일 전까지 전액 환불" : "전액 환불 가능";
  if (daysRemaining >= 15) return "지금 취소 시 50% 환불";
  if (daysRemaining >= 7) return "지금 취소 시 30% 환불";
  return "환불 불가 (출발 7일 미만)";
}

/** 정렬 탭 대표값용: 가장 이른 출발일 "M/D". */
export function earliestStartLabel(tours: Array<Pick<Tour, "startDate">>): string | null {
  if (tours.length === 0) return null;
  const d = tours.map((t) => t.startDate.slice(0, 10)).sort()[0];
  const [, m, day] = d.split("-").map(Number);
  return `${m}/${day}`;
}
