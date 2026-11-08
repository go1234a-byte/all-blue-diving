import type { Tour } from "@/types";

/** 홈·검색이 함께 쓰는 "모집 중 투어" 판정. 관리자가 정지/보류한 투어, 마감(최소 인원 미달 취소 포함)된 투어는 제외한다. */
export function isOpenTour(t: Pick<Tour, "adminStatus" | "status">): boolean {
  return !t.adminStatus && t.status === "open";
}

/** 모집 중 투어를 출발 월별로 센다. keyOf 는 lib/dates 의 monthKeyOf (연도 포함 월 키)를 넘긴다 —
 * 이 파일이 런타임 import 없이 단독으로 테스트되도록 주입받는다. */
export function countOpenToursByMonth(
  tours: Array<Pick<Tour, "adminStatus" | "status" | "startDate">>,
  keyOf: (iso: string) => number,
): Map<number, number> {
  const counts = new Map<number, number>();
  for (const t of tours) {
    if (!isOpenTour(t)) continue;
    const k = keyOf(t.startDate);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

/** 활동 필터("" = 전체). */
export function matchesActivity(t: Pick<Tour, "activityTypes">, act: string): boolean {
  return !act || t.activityTypes.includes(act as Tour["activityTypes"][number]);
}

/** 몇 명으로 갈 수 있는 투어인가. 1명(기본)은 거르지 않아 마감 투어도 "모집 마감"으로 그대로 보인다. */
export function hasSeatsFor(t: Pick<Tour, "maxParticipants">, joined: number, party: number): boolean {
  return party <= 1 || t.maxParticipants - joined >= party;
}

/** 출발일(YYYY-MM-DD) 오름차순으로 묶는다. */
export function groupToursByStartDate<T extends Pick<Tour, "startDate">>(tours: T[]): Array<{ date: string; tours: T[] }> {
  const map = new Map<string, T[]>();
  for (const t of [...tours].sort((a, b) => a.startDate.localeCompare(b.startDate))) {
    const d = t.startDate.slice(0, 10);
    (map.get(d) ?? map.set(d, []).get(d)!).push(t);
  }
  return [...map.entries()].map(([date, ts]) => ({ date, tours: ts }));
}

/** 투어 수가 많은 나라 순으로 최대 n개. 홈의 지역 칩을 실제 데이터에서 만든다. */
export function topCountries(tours: Array<Pick<Tour, "country">>, n: number): Array<{ country: string; count: number }> {
  const m = new Map<string, number>();
  for (const t of tours) if (t.country) m.set(t.country, (m.get(t.country) ?? 0) + 1);
  return [...m.entries()]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country))
    .slice(0, n);
}

const WEEKDAY_KR = ["일", "월", "화", "수", "목", "금", "토"];
/** "2026-11-29" → "11월 29일 일요일". 시간대에 흔들리지 않게 문자열로 직접 계산한다. */
export function dayLabelKR(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${m}월 ${d}일 ${WEEKDAY_KR[wd]}요일`;
}
