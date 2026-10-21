/**
 * ALL BLUE — 지도 탐색용 다이브 사이트 좌표 테이블.
 * `COUNTRIES_SITES`(lib/constants.ts)에 등록된 국가/사이트 조합에 한해
 * 대략적인 위경도를 정적으로 매핑한다(센터별 정확 좌표 대신 사이트 대표 좌표 사용).
 */
export interface SiteCoordinate {
  lat: number;
  lng: number;
}

export const SITE_COORDINATES: Record<string, Record<string, SiteCoordinate>> = {
  "필리핀": {
    "모알보알": { lat: 9.7167, lng: 123.3833 },
    "세부": { lat: 10.3157, lng: 123.8854 },
    "아닐라오": { lat: 13.7167, lng: 120.9167 },
  },
  "인도네시아": {
    "발리": { lat: -8.3405, lng: 115.092 },
    "코모도": { lat: -8.5455, lng: 119.4894 },
    "라자암팟": { lat: -0.2333, lng: 130.5167 },
  },
  "대한민국": {
    "제주도": { lat: 33.4996, lng: 126.5312 },
    "울릉도": { lat: 37.4845, lng: 130.9057 },
  },
  "팔라우": {
    "코로르": { lat: 7.3419, lng: 134.4791 },
  },
  "이집트": {
    "다합": { lat: 28.5091, lng: 34.5136 },
    "허가다": { lat: 27.2579, lng: 33.8116 },
  },
  "태국": {
    "코타오": { lat: 10.0956, lng: 99.8402 },
    "푸켓": { lat: 7.8804, lng: 98.3923 },
  },
  "몰디브": {
    "말레 아톨": { lat: 4.1755, lng: 73.5093 },
  },
};

export function getSiteCoordinate(country: string, site: string): SiteCoordinate | undefined {
  return SITE_COORDINATES[country]?.[site];
}

/**
 * 투어의 site 는 강사가 자유 입력("투바타하 리프", "담피어 해협 · 미솔", "툴룸 · 세노테")이라
 * 위 표에 정확히 없을 때가 많다. 키워드로 대표 좌표를 찾고, 그래도 없으면 나라 대표 바다로 대체한다.
 * 바다 예보(Open-Meteo)는 수 km 격자라 대표 좌표로도 충분하다.
 */
const SITE_KEYWORDS: { keys: string[]; coord: SiteCoordinate }[] = [
  { keys: ["투바타하", "tubbataha"], coord: { lat: 8.95, lng: 119.87 } },
  { keys: ["라자암팟", "담피어", "미솔", "raja"], coord: { lat: -0.55, lng: 130.6 } },
  { keys: ["모알보알"], coord: { lat: 9.95, lng: 123.36 } },
  { keys: ["말라파스쿠아"], coord: { lat: 11.33, lng: 124.11 } },
  { keys: ["막탄", "힐루퉁안", "세부"], coord: { lat: 10.25, lng: 124.02 } },
  { keys: ["보홀", "팡라오", "파나글라오"], coord: { lat: 9.55, lng: 123.77 } },
  { keys: ["두마게티", "아포"], coord: { lat: 9.13, lng: 123.27 } },
  { keys: ["아닐라오"], coord: { lat: 13.75, lng: 120.88 } },
  { keys: ["코론"], coord: { lat: 11.98, lng: 120.2 } },
  { keys: ["푸에르토 갈레라", "민도로"], coord: { lat: 13.52, lng: 120.95 } },
  { keys: ["보라카이"], coord: { lat: 11.97, lng: 121.92 } },
  { keys: ["툴람벤", "아메드"], coord: { lat: -8.28, lng: 115.6 } },
  { keys: ["누사 페니다", "페니다"], coord: { lat: -8.73, lng: 115.54 } },
  { keys: ["코모도"], coord: { lat: -8.55, lng: 119.49 } },
  { keys: ["렘베"], coord: { lat: 1.45, lng: 125.22 } },
  { keys: ["시파단", "마부울"], coord: { lat: 4.12, lng: 118.63 } },
  { keys: ["시밀란"], coord: { lat: 8.65, lng: 97.64 } },
  { keys: ["코타오", "꼬따오"], coord: { lat: 10.09, lng: 99.83 } },
  { keys: ["다합", "블루홀"], coord: { lat: 28.57, lng: 34.54 } },
  { keys: ["브라더스", "다이달루스", "엘핀스톤", "마르사알람"], coord: { lat: 25.3, lng: 34.9 } },
  { keys: ["게라마", "케라마"], coord: { lat: 26.2, lng: 127.3 } },
  { keys: ["이시가키"], coord: { lat: 24.34, lng: 124.16 } },
  { keys: ["미야코"], coord: { lat: 24.8, lng: 125.28 } },
  { keys: ["오키나와"], coord: { lat: 26.5, lng: 127.85 } },
  { keys: ["제주", "서귀포", "문섬", "범섬"], coord: { lat: 33.22, lng: 126.56 } },
  { keys: ["울릉"], coord: { lat: 37.48, lng: 130.9 } },
  { keys: ["코로르", "팔라우"], coord: { lat: 7.25, lng: 134.35 } },
  { keys: ["몰디브", "아톨", "말레"], coord: { lat: 4.17, lng: 73.5 } },
  { keys: ["소코로"], coord: { lat: 18.78, lng: -110.95 } },
  { keys: ["코즈멜"], coord: { lat: 20.42, lng: -86.92 } },
];

const COUNTRY_FALLBACK: Record<string, SiteCoordinate> = {
  필리핀: { lat: 10.25, lng: 124.02 },
  인도네시아: { lat: -8.28, lng: 115.6 },
  대한민국: { lat: 33.22, lng: 126.56 },
  일본: { lat: 26.2, lng: 127.3 },
  팔라우: { lat: 7.25, lng: 134.35 },
  이집트: { lat: 28.57, lng: 34.54 },
  태국: { lat: 10.09, lng: 99.83 },
  말레이시아: { lat: 4.12, lng: 118.63 },
  몰디브: { lat: 4.17, lng: 73.5 },
  멕시코: { lat: 20.42, lng: -86.92 },
};

export function resolveTourCoordinate(country: string, site: string): SiteCoordinate | undefined {
  const exact = getSiteCoordinate(country, site);
  if (exact) return exact;
  const hay = `${country} ${site}`.toLowerCase();
  const hit = SITE_KEYWORDS.find((k) => k.keys.some((key) => hay.includes(key.toLowerCase())));
  return hit?.coord ?? COUNTRY_FALLBACK[country?.trim()];
}

/** 세노테·호수·강 등 민물 다이빙은 바다 예보가 의미 없다. */
export function isFreshwaterSite(site: string): boolean {
  return /세노테|cenote|호수|호$|강$|광산|실프라|바이칼/i.test(site);
}
