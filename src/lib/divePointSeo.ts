// ALL BLUE — 다이빙 포인트 가이드 페이지(/dive, /dive/:id) 공용 로직.
//
// 화면(src/pages/DivePoint*.tsx)과 빌드 후 정적 HTML 생성 스크립트
// (scripts/prerender-dive.mjs)가 이 파일을 같이 쓴다 — 그래서 "@/" 별칭 없이 상대 경로만
// 쓰고, React·브라우저 API에 의존하지 않는 순수 함수만 둔다.

import { DIVE_POINTS, GUIDE_BY_MONTH, type DivePoint } from "../content/divePointGuide";

/**
 * 검색엔진 색인 스위치.
 *
 * divePointGuide.ts 머리말대로 시즌·수온·포인트 정보는 아직 "예시 — 게시 전 확인 필요"
 * 상태이고, 사진도 10장을 돌려 쓰고 있다(예: 몰디브에 고래 사진). 검수 전에 구글/네이버에
 * 색인되면 틀린 정보가 검색 결과에 남기 때문에 기본값은 false다:
 *   - false: 페이지는 열리고 홈에서 링크도 되지만, <meta robots noindex> + 사이트맵 제외
 *   - true : 색인 허용 + sitemap.xml에 /dive, /dive/:id 전부 포함
 * 콘텐츠 검수가 끝나면 이 한 줄만 true로 바꿔 배포하면 된다.
 */
export const DIVE_GUIDE_INDEXABLE = false;

export const SITE_URL = "https://allbluedive.com";
export const MONTH_LABELS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

/** 데이터 문자열 끝에 붙은 "(예시)" 표기 — 페이지에선 하단 안내문 한 번으로 대신한다. */
export function stripExample(text: string): string {
  return text.replace(/\s*\(예시\)\s*$/, "").trim();
}

export function allDivePoints(): DivePoint[] {
  return Object.values(DIVE_POINTS);
}

export function getDivePoint(id: string | undefined): DivePoint | undefined {
  if (!id || !Object.prototype.hasOwnProperty.call(DIVE_POINTS, id)) return undefined;
  return DIVE_POINTS[id];
}

/** GUIDE_BY_MONTH에서 이 포인트가 추천되는 달(0=1월 … 11=12월). */
export function recommendedMonths(id: string): number[] {
  return GUIDE_BY_MONTH.flatMap((ids, month) => (ids.includes(id) ? [month] : []));
}

/** [0,1,2,10,11] → "11월~3월" 처럼 연속 구간으로 묶는다 (연말→연초 이어짐 포함). */
export function formatMonthRanges(months: number[]): string {
  if (months.length === 0) return "";
  if (months.length === 12) return "연중";
  const set = new Set(months);
  // 연말→연초로 이어지는 경우(12월과 1월이 둘 다 있음)만 비어 있는 달 다음부터 세어
  // "11월~3월"처럼 한 덩어리로 묶고, 아니면 1월부터 순서대로 센다.
  let start = 11;
  if (set.has(0) && set.has(11)) {
    start = 0;
    while (set.has(start)) start++;
  }
  const ranges: [number, number][] = [];
  for (let k = 1; k <= 12; k++) {
    const m = (start + k) % 12;
    if (!set.has(m)) continue;
    const last = ranges[ranges.length - 1];
    if (last && (last[1] + 1) % 12 === m) last[1] = m;
    else ranges.push([m, m]);
  }
  return ranges
    .map(([a, b]) => (a === b ? MONTH_LABELS[a] : `${MONTH_LABELS[a]}~${MONTH_LABELS[b]}`))
    .join(", ");
}

/** "필리핀 · 세부 말라파스쿠아" → { country: "필리핀", place: "세부 말라파스쿠아" } */
export function splitRegion(region: string): { country?: string; place: string } {
  // 괄호 안의 "·"(예: "이집트 홍해 (북부 · 데이트립)")는 나라 구분자가 아니다.
  // 나라 구분자는 앞뒤에 공백이 있는 " · "뿐이다("몰디브 바·라 아톨"의 "·"는 지명의 일부).
  const outside = region.replace(/\([^)]*\)/g, "");
  const idx = outside.indexOf(" · ");
  if (idx < 0) return { place: region.trim() };
  const country = outside.slice(0, idx).trim();
  return { country, place: region.slice(region.indexOf(" · ", country.length) + 3).trim() };
}

const STOP_WORDS = new Set([
  "제도", "섬", "리프", "아톨", "남부", "북부", "인근", "데이트립", "최서단", "호수", "광산",
  "베이", "해협", "센트럴", "아일랜드", "동양의", "5호",
]);
// 지명이긴 하지만 너무 넓어서(여러 포인트가 공유) 검색어로는 뒤로 미루는 단어.
const BROAD_WORDS = new Set([
  "오키나와", "세부", "루손", "팔라완", "민도로", "기후현", "홋카이도", "서호주", "에콰도르", "포르투갈", "이집트", "홍해", "발리",
]);

/** 투어 검색·관련 투어 매칭에 쓸 지역 키워드 (국가명 제외, 구체 지명 우선). */
export function placeKeywords(point: DivePoint): string[] {
  // 괄호 안(별칭·부연 — 예: 오가사와라의 "동양의 갈라파고스")은 다른 지역과 엉뚱하게
  // 매칭될 수 있어 키워드에서 뺀다.
  const place = splitRegion(point.region).place.replace(/\([^)]*\)/g, " ");
  const words = place
    .split(/[\s,()·/"\\]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
  return [...new Set(words)];
}

export interface TourLike {
  country: string;
  site: string;
  title: string;
}

/** 이 포인트와 관련된 투어인지 — 구체 지명이 투어 지역/제목에 들어 있으면 관련 투어. */
export function isRelatedTour(point: DivePoint, tour: TourLike): boolean {
  const hay = `${tour.site} ${tour.title}`.toLowerCase();
  return placeKeywords(point).some((k) => hay.includes(k.toLowerCase()));
}

/** 구체 지명은 안 맞지만 같은 나라인 투어 (관련 투어가 없을 때 대신 보여준다). */
export function isSameCountryTour(point: DivePoint, tour: TourLike): boolean {
  const { country, place } = splitRegion(point.region);
  const c = (country ?? place.split(/[\s,(]/)[0]).trim();
  return c.length >= 2 && tour.country.includes(c);
}

/** 검색 화면으로 넘길 검색어 — 가장 구체적인 지명 하나. */
export function searchQueryFor(point: DivePoint): string {
  const words = placeKeywords(point);
  return words.find((w) => !BROAD_WORDS.has(w)) ?? words[0] ?? splitRegion(point.region).country ?? point.region;
}

export function divePointPath(id: string): string {
  return `/dive/${id}`;
}

export function divePointMeta(point: DivePoint) {
  const months = formatMonthRanges(recommendedMonths(point.id));
  const title = `${point.region} 다이빙 가이드${months ? ` — 추천 시기 ${months}` : ""}`;
  const life = point.life.slice(0, 3).join("·");
  const description = `${point.oneLiner} ${life ? `${life} 등을 만날 수 있는 ` : ""}${point.region}의 시즌·수온·대표 포인트·추천 레벨을 정리했습니다.`
    .replace(/\s+/g, " ")
    .trim();
  return {
    title,
    description: description.length > 155 ? `${description.slice(0, 154)}…` : description,
    path: divePointPath(point.id),
    image: `${SITE_URL}${point.image}`,
  };
}

export const DIVE_INDEX_META = {
  title: "다이빙 포인트 가이드 — 월별 추천 다이빙 여행지",
  description:
    "몰디브·팔라우·필리핀·제주까지, 월별로 다이빙하기 좋은 국내외 다이빙 포인트의 시즌·수온·해양생물·추천 레벨을 한눈에 비교하세요.",
  path: "/dive",
};

/** /dive/:id 구조화 데이터 — 여행지(TouristDestination) + 이동 경로(Breadcrumb). */
export function divePointJsonLd(point: DivePoint) {
  const url = `${SITE_URL}${divePointPath(point.id)}`;
  const meta = divePointMeta(point);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TouristDestination",
        "@id": `${url}#destination`,
        name: point.region,
        description: meta.description,
        url,
        image: [point.image, ...point.gallery].map((p) => `${SITE_URL}${p}`),
        touristType: point.special ? "Technical diving" : "Scuba diving",
        includesAttraction: point.points.map((pt) => ({
          "@type": "TouristAttraction",
          name: pt.name,
          description: pt.desc.replace(/^\[[^\]]+\]\s*/, ""),
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "다이빙 포인트 가이드", item: `${SITE_URL}/dive` },
          { "@type": "ListItem", position: 3, name: point.region, item: url },
        ],
      },
    ],
  };
}

export function diveIndexJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: DIVE_INDEX_META.title,
    url: `${SITE_URL}/dive`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: allDivePoints().map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.region,
        url: `${SITE_URL}${divePointPath(p.id)}`,
      })),
    },
  };
}

/** 이 포인트의 대표 포인트 설명 앞 "[대물]" 같은 태그를 분리한다. */
export function splitPointTag(desc: string): { tag?: string; text: string } {
  const m = desc.match(/^\[([^\]]+)\]\s*(.*)$/);
  return m ? { tag: m[1], text: m[2] } : { text: desc };
}
