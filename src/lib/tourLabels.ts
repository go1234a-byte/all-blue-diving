import type { Tour } from "@/types";
import { CERTIFICATION_LABELS } from "@/lib/constants";

/**
 * 투어 카드·상세·홈에서 같은 투어가 서로 다른 말로 보이지 않게 하는 공용 표시 규칙.
 * (예전엔 홈은 "입문 가능", 검색은 강사 태그 "초보환영", 상세는 "OW"로 제각각이었다.)
 */

/** 여행 일수(박+1). 시작/종료일이 같으면 1. */
export function tourTotalDays(t: Pick<Tour, "startDate" | "endDate">): number {
  const s = new Date(t.startDate);
  s.setHours(0, 0, 0, 0);
  const e = new Date(t.endDate);
  e.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
}

/**
 * 참가 조건 한 줄 — 모든 화면이 이 함수만 쓴다.
 * 로그 조건이 있으면 그게 가장 구체적이므로 우선, 없으면 요구 자격 기준.
 * 프리다이빙 "입문" 레벨만 무자격 참가가 가능하므로 "입문 가능"으로 표기한다.
 */
export function tourLevelLabel(t: Pick<Tour, "minLogCount" | "certificationLevel">): string {
  if (t.minLogCount && t.minLogCount > 0) return `로그 ${t.minLogCount}+`;
  // DB에는 "ow" 같은 키 말고도 "AOW"(대문자)·"무관" 같은 값이 섞여 있어 정규화한다.
  const raw = String(t.certificationLevel ?? "").trim();
  const key = raw.toLowerCase() as keyof typeof CERTIFICATION_LABELS;
  if (!raw || raw === "무관" || key === "basic") return "입문 가능";
  const label = CERTIFICATION_LABELS[key] ?? raw;
  return `${label} 이상`;
}

/** 자격증이 없거나 오픈워터만 있어도 참가 가능한 투어인지 (검색 "입문자 참가 가능" 필터). */
export function isBeginnerFriendly(t: Pick<Tour, "minLogCount" | "certificationLevel">): boolean {
  if (t.minLogCount && t.minLogCount > 0) return false;
  const key = String(t.certificationLevel ?? "").trim().toLowerCase();
  return !key || key === "무관" || key === "ow" || key === "basic";
}

/**
 * "출발확정" 배지는 강사가 확정 표시를 했고 실제 신청 인원이 최소 인원을 채웠을 때만 보여준다.
 * 신청 0명인데 "출발확정"이 뜨면 오히려 신뢰를 잃는다.
 */
export function isDepartureConfirmed(
  t: Pick<Tour, "isConfirmed" | "minParticipants">,
  joinedCount: number,
): boolean {
  return t.isConfirmed && joinedCount >= Math.max(1, t.minParticipants || 0);
}

/** 강사가 여행 일수만큼 일자별 일정을 모두 채웠을 때만 "일자별 일정 제공"이라고 말한다. */
export function hasFullItinerary(t: Pick<Tour, "itineraryDays" | "startDate" | "endDate">): boolean {
  return (t.itineraryDays?.length ?? 0) >= tourTotalDays(t);
}

/**
 * 일정 항목 값이 라벨로 시작하면 라벨을 떼어 "다이빙 다이빙 3회" 같은 중복을 막는다.
 * 예: stripLeadingLabel("다이빙", "다이빙 3회") → "3회"
 */
export function stripLeadingLabel(label: string, value: string): string {
  const v = value.trim();
  if (v.startsWith(label)) {
    const rest = v.slice(label.length).replace(/^[\s:·-]+/, "");
    return rest || v;
  }
  return v;
}

/** 평점·완료율처럼 표본이 적으면 오히려 오해를 주는 지표를 숨길 기준. */
export const MIN_SAMPLE_FOR_RATE = 3;
