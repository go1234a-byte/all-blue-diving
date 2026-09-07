/**
 * 리브어보드 정보 섹션 — 웹 랜딩(Landing.tsx) 3번 섹션용 정적 콘텐츠.
 *
 * ⚠️ 예시 콘텐츠입니다. 아래 국가·기간·방문 포인트는 일반적으로 알려진 정보 수준이며,
 *    실제 취급 상품과 다를 수 있습니다. 게시 전 반드시 직접 확인·수정하세요.
 *    TOUR(예약) 데이터와는 무관하며, 가격·예약 CTA는 넣지 않습니다.
 */

export interface LiveaboardRegion {
  id: string;
  /** 국가/지역명 */
  name: string;
  /** 카드 대표 이미지 (/public/landing/) */
  image: string;
  /** 카드에 보이는 한 줄 요약 */
  summary: string;
  /** 상세 모달용 추가 이미지 */
  gallery: string[];
  /** 상세 설명 (예시) */
  detail: string;
  /** 일반적으로 운영되는 코스 길이 (예시) */
  durations: string[];
  /** 대표 여정 — 방문 다이빙 포인트를 순서대로 (예시) */
  route: string[];
}

export const LIVEABOARD_REGIONS: LiveaboardRegion[] = [
  {
    id: "komodo",
    name: "인도네시아 · 코모도",
    image: "/landing/boat.jpg",
    summary: "강한 조류가 만드는 대형 어류 액션과 만타 포인트를 도는 코스.",
    gallery: ["/landing/whale.jpg","/landing/turtle.jpg"],
    detail:
      "북부는 시야가 좋고 남부는 만타·몰라몰라 확률이 높아, 코스에 따라 다이빙 성격이 크게 갈린다. 라부안바조에서 출항한다.",
    durations: ["3박 4일", "6박 7일", "8박 9일"],
    route: ["라부안바조 출항", "사보누사", "코모도 섬 (만타 앨리)", "파다르 섬", "카스텔로", "라부안바조 귀항"],
  },
  {
    id: "rajaampat",
    name: "인도네시아 · 라자암팟",
    image: "/landing/coral.jpg",
    summary: "산호 피복률 세계 최고 수준. 남부·중부·북부 환초를 폭넓게 이동.",
    gallery: ["/landing/turtle.jpg","/landing/scuba1.jpg"],
    detail:
      "산호 피복률이 세계 최고 수준이라 어느 포인트를 가도 밀도가 높다. 소롱에서 출항해 미솔~와이게오를 크게 돈다.",
    durations: ["7박 8일", "10박 11일", "12박 13일"],
    route: ["소롱 출항", "미솔 남부", "펜에모 (미니 월)", "다양 (블루 마린)", "카비 자갈밭", "소롱 귀항"],
  },
  {
    id: "maldives",
    name: "몰디브",
    image: "/landing/whale.jpg",
    summary: "환초 채널 드리프트와 만타·고래상어. 북말레~남부 아리 환초 루트.",
    gallery: ["/landing/descend.jpg","/landing/boat.jpg"],
    detail:
      "환초 채널의 드리프트가 중심. 시즌에 따라 만타·고래상어 포인트를 코스에 넣는다. 말레에서 출항.",
    durations: ["7박 8일", "10박 11일"],
    route: ["말레 출항", "북말레 환초", "아리 환초 (마아미기리)", "남말레 환초", "펠리두 채널", "말레 귀항"],
  },
  {
    id: "redsea",
    name: "이집트 · 홍해",
    image: "/landing/descend.jpg",
    summary: "북부(난파선)·브라더스·데다루스 등 목적에 따라 코스가 갈린다.",
    gallery: ["/landing/scuba1.jpg","/landing/coral.jpg"],
    detail:
      "북부(난파선)·브라더스·심야(Deep South) 등 목적에 따라 완전히 다른 코스가 있다. 후르가다·포트갈리브에서 출항.",
    durations: ["7박 8일"],
    route: ["후르가다/포트갈리브 출항", "브라더스 제도", "데다루스 리프", "엘핀스톤", "귀항"],
  },
  {
    id: "galapagos",
    name: "에콰도르 · 갈라파고스",
    image: "/landing/hero.jpg",
    summary: "차가운 물살 속 귀상어 무리·고래상어. 상급자 대상 원격 코스.",
    gallery: ["/landing/descend.jpg","/landing/whale.jpg"],
    detail:
      "다윈·울프 섬은 데이트립이 불가능해 리브어보드로만 접근한다. 수온이 낮고 조류가 강해 경험이 필요하다.",
    durations: ["7박 8일"],
    route: ["산크리스토발 출항", "다윈 아치", "울프 섬", "카보 마샬", "산크리스토발 귀항"],
  },
  {
    id: "tubbataha",
    name: "필리핀 · 투바타하",
    image: "/landing/group.jpg",
    summary: "1년에 3~4개월만 열리는 유네스코 해양공원. 벽·환초 다이빙.",
    gallery: ["/landing/coral.jpg","/landing/turtle.jpg"],
    detail:
      "3~6월 4개월만 개방되는 유네스코 해양공원. 푸에르토프린세사에서 출항해 노스·사우스 아톨을 돈다.",
    durations: ["5박 6일", "6박 7일"],
    route: ["푸에르토프린세사 출항", "노스 아톨", "사우스 아톨", "제슬리 셔벌 리프", "귀항"],
  },
];
