/**
 * 다이빙 포인트 가이드 — 웹 랜딩(Landing.tsx) 2번 섹션용 정적 콘텐츠.
 *
 * ⚠️ 예시 콘텐츠입니다. 아래 시즌/수온/해양생물 정보는 검증되지 않은 일반 상식 수준이며,
 *    게시 전 반드시 직접 확인·수정하세요. TOUR(예약) 데이터와는 무관합니다.
 *
 * 수정 방법:
 *  - DIVE_POINTS 에 포인트를 추가/수정 (image 는 /public/landing/ 안의 파일명)
 *  - GUIDE_BY_MONTH 의 각 달(0=1월 … 11=12월) 배열에 보여줄 포인트 id 를 나열
 */

export interface DivePoint {
  id: string;
  /** 지역/국가명 */
  region: string;
  /** /public/landing/ 이미지 경로 */
  image: string;
  /** 한 줄 소개 */
  oneLiner: string;
  /** 그 시기 수온·시야 (예시) */
  water: string;
  /** 만날 수 있는 해양생물 (예시) */
  life: string[];
}

export const DIVE_POINTS: Record<string, DivePoint> = {
  rajaampat: {
    id: "rajaampat",
    region: "라자암팟, 인도네시아",
    image: "/landing/coral.jpg",
    oneLiner: "지구상에서 산호·어류 다양성이 가장 높다고 알려진 해역.",
    water: "수온 28–30°C · 시야 15–30m (예시)",
    life: ["만타레이", "월빙 상어", "피그미 시호스"],
  },
  maldives: {
    id: "maldives",
    region: "몰디브 (아리 · 남말레 환초)",
    image: "/landing/whale.jpg",
    oneLiner: "환초 채널의 드리프트 다이빙과 대형 회유어가 매력.",
    water: "수온 27–30°C · 시야 20–40m (예시)",
    life: ["만타레이", "고래상어", "회색암초상어"],
  },
  redsea: {
    id: "redsea",
    region: "홍해 (다합 · 후르가다), 이집트",
    image: "/landing/descend.jpg",
    oneLiner: "블루홀·드롭오프와 연산호 벽으로 유명한 지중해권 관문.",
    water: "수온 21–28°C · 시야 20–30m (예시)",
    life: ["나폴레옹피시", "곰치", "바라쿠다 무리"],
  },
  komodo: {
    id: "komodo",
    region: "코모도, 인도네시아",
    image: "/landing/boat.jpg",
    oneLiner: "강한 조류가 만들어내는 대형 어류 액션과 만타 포인트.",
    water: "수온 20–29°C · 시야 15–30m (예시)",
    life: ["만타레이", "화이트팁 리프샤크", "몰라몰라(계절)"],
  },
  sipadan: {
    id: "sipadan",
    region: "시파단, 말레이시아",
    image: "/landing/turtle.jpg",
    oneLiner: "수천 마리 바라쿠다 토네이도와 바다거북 밀도로 손꼽히는 섬.",
    water: "수온 27–30°C · 시야 15–30m (예시)",
    life: ["바다거북", "바라쿠다 토네이도", "잭피시 볼"],
  },
  cebu: {
    id: "cebu",
    region: "세부 (모알보알 · 말라파스쿠아), 필리핀",
    image: "/landing/scuba1.jpg",
    oneLiner: "정어리 떼와 새벽 환도상어(long-tail thresher)로 알려진 지역.",
    water: "수온 27–30°C · 시야 10–25m (예시)",
    life: ["정어리 떼", "환도상어", "바다거북"],
  },
  palau: {
    id: "palau",
    region: "팔라우",
    image: "/landing/group.jpg",
    oneLiner: "블루코너·저먼채널의 상어 라인업과 젤리피시 레이크.",
    water: "수온 28–30°C · 시야 20–35m (예시)",
    life: ["회색암초상어", "만타레이", "나폴레옹피시"],
  },
  kohtao: {
    id: "kohtao",
    region: "코타오, 태국",
    image: "/landing/freedive1.jpg",
    oneLiner: "잔잔한 만과 얕은 수심 — 입문·프리다이빙 교육의 메카.",
    water: "수온 28–30°C · 시야 10–25m (예시)",
    life: ["고래상어(계절)", "바다거북", "블루스팟 스팅레이"],
  },
  galapagos: {
    id: "galapagos",
    region: "갈라파고스, 에콰도르",
    image: "/landing/hero.jpg",
    oneLiner: "차가운 물살 속 대형 원양 생물 — 상급자 리브어보드 위주.",
    water: "수온 18–26°C · 시야 10–25m (예시)",
    life: ["귀상어 무리", "고래상어", "바다이구아나"],
  },
};

/** 달(0=1월 … 11=12월)별로 보여줄 포인트 id 목록 — 예시. 게시 전 확인 필요. */
export const GUIDE_BY_MONTH: string[][] = [
  ["rajaampat", "maldives", "kohtao", "sipadan"], // 1월
  ["rajaampat", "maldives", "cebu", "palau"], // 2월
  ["redsea", "maldives", "cebu", "kohtao"], // 3월
  ["redsea", "komodo", "cebu", "galapagos"], // 4월
  ["redsea", "komodo", "sipadan", "galapagos"], // 5월
  ["komodo", "sipadan", "galapagos", "kohtao"], // 6월
  ["komodo", "sipadan", "galapagos", "kohtao"], // 7월
  ["komodo", "sipadan", "galapagos", "cebu"], // 8월
  ["redsea", "komodo", "sipadan", "galapagos"], // 9월
  ["redsea", "komodo", "palau", "cebu"], // 10월
  ["rajaampat", "redsea", "palau", "maldives"], // 11월
  ["rajaampat", "maldives", "palau", "kohtao"], // 12월
];
