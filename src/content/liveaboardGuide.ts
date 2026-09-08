/**
 * 리브어보드 정보 섹션 — 웹 랜딩(Landing.tsx) 3번 섹션용 정적 콘텐츠.
 *
 * ⚠️ 예시 콘텐츠 — 게시 전 확인 필요.
 *    아래 국가·기간·방문 포인트는 다이빙 업계 자료를 참고한 일반적인 정보이며,
 *    운영사마다 세부 일정은 다를 수 있습니다. 실제 취급 상품 정보로 교체하세요.
 *    TOUR(예약) 데이터와는 무관하며, 가격·예약 CTA는 넣지 않습니다.
 */

export interface LiveaboardRegion {
  id: string;
  name: string;
  image: string;
  /** 카드에 보이는 한 줄 요약 */
  summary: string;
  gallery: string[];
  detail: string;
  /** 일반적으로 운영되는 코스 길이 (예시) */
  durations: string[];
  /** 대표 여정 — 방문 다이빙 포인트를 순서대로 (예시) */
  route: string[];
}

export const LIVEABOARD_REGIONS: LiveaboardRegion[] = [
  {
    id: "redsea",
    name: "이집트 홍해 (브라더스·다이달루스·엘핀스톤)",
    image: "/landing/descend.jpg",
    summary: "상어 다이빙으로 유명한 남부 리프 종주. 6월 전후가 따뜻하고 잔잔하다.",
    gallery: ["/landing/scuba1.jpg", "/landing/coral.jpg"],
    detail:
      "오세아닉 화이트팁·귀상어·스레셔 샤크 등 원양 상어를 노리는 코스. 난파선 중심의 북부 코스와는 성격이 완전히 다르다. 후르가다에서 출발·도착.",
    durations: ["7박 8일"],
    route: [
      "스몰 기프튼 아일랜드",
      "빅/스몰 브라더 아일랜드 (난파선 아이다·누미디아)",
      "다이달루스 리프",
      "엘핀스톤 리프",
    ],
  },
  {
    id: "rajaampat",
    name: "인도네시아 라자암팟 (담피어 해협–미솔)",
    image: "/landing/coral.jpg",
    summary: "산호·마크로 생물의 밀도가 세계 최고 수준. 10~4월 건기가 최적.",
    gallery: ["/landing/turtle.jpg", "/landing/scuba1.jpg"],
    detail:
      "리프·오세아닉 만타레이와 피그미 해마 등 마크로 생물이 풍부하다. 10~12월이 미솔 방문에 특히 좋다. 소롱에서 출발·도착.",
    durations: ["7박 8일", "10박 11일"],
    route: [
      "담피어 해협 (케이프 크리, 블루매직)",
      "피아이네모·페네무 전망대",
      "미솔 지역 다수의 다이빙 포인트",
    ],
  },
  {
    id: "maldives",
    name: "몰디브 (센트럴 아톨 / 바·라 아톨)",
    image: "/landing/whale.jpg",
    summary: "채널 드리프트 중심. 8~10월은 하니파루 베이 만타 성수기.",
    gallery: ["/landing/descend.jpg", "/landing/boat.jpg"],
    detail:
      "만타레이·고래상어·리프샤크를 채널 드리프트로 만난다. 북에서 남까지 종주하는 긴 코스와 센트럴 아톨만 도는 짧은 코스가 있다. 말레에서 출발·도착.",
    durations: ["7박 8일", "10박 11일"],
    route: [
      "노스/사우스 말레 아톨",
      "아리 아톨 (고래상어)",
      "바아/라 아톨 (하니파루 베이 만타 클리닝 스테이션, 8~10월 성수기)",
    ],
  },
  {
    id: "similan",
    name: "태국 시밀란 제도 (안다만해)",
    image: "/landing/turtle.jpg",
    summary: "10월 중순~5월 중순 시즌. 리치엘리유 록이 하이라이트.",
    gallery: ["/landing/coral.jpg", "/landing/scuba1.jpg"],
    detail:
      "코본에서 만타레이, 리치엘리유 록에서 화려한 연산호와 매크로 생물을 관찰한다. 카오락·푸켓에서 출발하는 짧은 코스가 많다.",
    durations: ["3박 4일", "5박 6일"],
    route: ["시밀란 제도", "코본", "코따차이", "수린 제도", "리치엘리유 록"],
  },
  {
    id: "socorro",
    name: "멕시코 소코로 (레비야히헤도 제도)",
    image: "/landing/whale.jpg",
    summary: "대형 오세아닉 만타레이와 귀상어 무리. 11월~6월 시즌.",
    gallery: ["/landing/descend.jpg", "/landing/group.jpg"],
    detail:
      "돌고래·귀상어 무리와 다이버에게 다가오는 대형 만타레이로 유명하다. 1~3월은 혹등고래도 함께 볼 수 있다. 산호세델카보에서 출발·도착.",
    durations: ["8박 9일", "9박 10일"],
    route: [
      "산베네딕토 섬 (더 보일러, 더 캐년)",
      "소코로 섬 (카보 피어스)",
      "로카 파르티다",
    ],
  },
  {
    id: "tubbataha",
    name: "필리핀 투바타하 리프 (술루해)",
    image: "/landing/turtle.jpg",
    summary: "리브어보드로만 접근하는 유네스코 산호초. 시즌은 3월 중순~6월 중순으로 매우 짧다.",
    gallery: ["/landing/coral.jpg", "/landing/descend.jpg"],
    detail:
      "노스·사우스 아톨의 수직 벽과 제슬리 셔벌 리프를 돈다. 개방 기간이 짧아 예약 경쟁이 치열하다. 푸에르토프린세사에서 출발·도착.",
    durations: ["5박 6일"],
    route: [
      "노스 아톨",
      "사우스 아톨",
      "델리케이트 리프",
      "자고 섬 (등대·레인저스테이션)",
    ],
  },
  {
    id: "gbr",
    name: "호주 그레이트 배리어 리프·코럴 씨 (케언즈)",
    image: "/landing/coral.jpg",
    summary: "포테이토 코드·대형 난파선·상어 다이빙을 한 번에. 날씨가 좋은 8~1월 추천.",
    gallery: ["/landing/scuba1.jpg", "/landing/turtle.jpg"],
    detail:
      "코드홀의 대형 포테이토 코드, SS 용갈라 난파선, 코럴 씨 외곽의 상어 다이빙을 묶는 코스. 케언즈에서 출발·도착.",
    durations: ["3박 4일", "7박 8일"],
    route: [
      "코드홀 (리본리프)",
      "SS 용갈라 난파선",
      "오스프리 리프 등 코럴 씨 외곽 포인트",
    ],
  },
  {
    id: "galapagos",
    name: "갈라파고스 (에콰도르)",
    image: "/landing/whale.jpg",
    summary: "해머헤드 무리·만타레이·바다이구아나. 조류가 강해 숙련자 대상.",
    gallery: ["/landing/descend.jpg", "/landing/hero.jpg"],
    detail:
      "다윈·울프 섬은 데이트립이 불가능해 리브어보드로만 간다. 수온이 낮고 조류가 강해 로그 수·드라이슈트 경험이 요구된다. 산크리스토발에서 출발·도착.",
    durations: ["7박 8일"],
    route: [
      "다윈 섬",
      "울프 섬",
      "이사벨라·페르난디나 섬",
    ],
  },
];
