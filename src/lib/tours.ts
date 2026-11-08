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

/**
 * 가이드 지역 이름("필리핀 · 세부 말라파스쿠아", "일본 · 게라마 제도 (오키나와 인근)")에서
 * 투어와 맞춰 볼 가장 구체적인 지명 하나를 고른다. 괄호 설명과 "제도/섬/아톨" 같은 일반어는 뺀다.
 * ponytail: 가장 긴 단어 = 가장 구체적인 지명이라는 휴리스틱. 틀리는 지역이 나오면 DivePoint 에 match 키워드를 둔다.
 */
const GENERIC_PLACE_WORDS = new Set(["제도", "섬", "아톨", "인근", "반도"]);
export function pointKeyword(region: string): string {
  const place = (region.split("·").slice(1).join(" ") || region).replace(/\(.*?\)/g, " ");
  const words = place.split(/[\s,·]+/).filter((w) => w && !GENERIC_PLACE_WORDS.has(w));
  const best = words.reduce((a, w) => (w.length > a.length ? w : a), "");
  // "제주도"·"울릉도"처럼 '도'로 끝나는 섬 이름은 투어에 "제주"로만 적히는 경우가 많다.
  return best.length === 3 && best.endsWith("도") ? best.slice(0, 2) : best;
}

/** 가이드 지역과 같은 곳의 투어(장소·제목에 지명이 들어간 것). */
export function toursAtPoint<T extends { site: string; title: string }>(region: string, tours: T[]): T[] {
  const kw = pointKeyword(region);
  if (!kw) return [];
  return tours.filter((t) => `${t.site} ${t.title}`.includes(kw));
}
