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
