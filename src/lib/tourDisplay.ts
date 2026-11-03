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
