import type { ActivityType } from "@/types";

/**
 * "어디로 갈지 고민되나요?" — 스쿠버·프리다이빙 포인트별 최적 시기 데이터.
 *
 * 스카이스캐너의 "언제 예약할지 고민되나요?" 카드처럼, 현재 달(또는 사용자가 고른 달)을
 * 기준으로 "지금이 최적 / 곧 성수기 / 무난 / 비수기"를 계산해 카드뉴스 형태로 보여준다.
 * 투어 DB와 무관한 큐레이션 콘텐츠라 여기 상수로 관리한다. month는 0-based(0=1월).
 */

export const MONTH_LABELS_KR = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

export interface DiveSpot {
  id: string;
  /** 카드 제목에 쓰는 지역명 */
  name: string;
  /** /search?q= 로 넘길 국가/지역 키워드 (COUNTRIES_SITES 기준) */
  query: string;
  region: "동남아" | "태평양" | "중동·홍해" | "인도양" | "국내";
  activities: ActivityType[];
  /** 성수기(0-based) */
  bestMonths: number[];
  /** 무난하게 다이빙 가능한 달(0-based) */
  shoulderMonths: number[];
  /** 카드뉴스 헤드라인 — 그 시기에 왜 좋은지 한 줄 */
  headline: string;
  /** 2~3줄 설명 */
  blurb: string;
  /** 수온·시야 */
  water: string;
  /** 이 포인트의 시그니처 (칩으로 표시) */
  highlights: string[];
}

export const DIVE_SPOTS: DiveSpot[] = [
  {
    id: "moalboal",
    name: "필리핀 세부·모알보알",
    query: "필리핀",
    region: "동남아",
    activities: ["scuba", "freediving"],
    bestMonths: [10, 11, 0, 1, 2, 3, 4], // 11~5월 건기
    shoulderMonths: [5, 9],
    headline: "정어리 토네이도가 가장 크게 뭉치는 건기",
    blurb:
      "수백만 마리 정어리떼가 연중 머물지만, 파도가 잔잔한 건기(11~5월)에 시야가 트여 사르딘 런과 바다거북을 가장 선명하게 볼 수 있어요. 프리다이빙 입문자에게도 부담 없는 잔잔한 하우스리프.",
    water: "수온 27~29°C · 시야 20~30m",
    highlights: ["정어리떼", "바다거북", "하우스리프"],
  },
  {
    id: "anilao",
    name: "필리핀 아닐라오",
    query: "필리핀",
    region: "동남아",
    activities: ["scuba"],
    bestMonths: [10, 11, 0, 1, 2],
    shoulderMonths: [3, 4],
    headline: "매크로 천국, 갯민숭달팽이가 폭발하는 시기",
    blurb:
      "세계적인 매크로·머크 다이빙 성지. 11~3월에 수온이 살짝 내려가면서 누디브랜치와 희귀 갑각류가 크게 늘어 수중 사진가들이 몰립니다.",
    water: "수온 25~28°C · 시야 10~20m",
    highlights: ["누디브랜치", "매크로", "머크다이빙"],
  },
  {
    id: "kohtao",
    name: "태국 코타오",
    query: "태국",
    region: "동남아",
    activities: ["freediving", "scuba"],
    bestMonths: [2, 3, 4, 5, 6, 7],
    shoulderMonths: [1, 8],
    headline: "고래상어 시즌 + 잔잔한 수면의 프리다이빙 메카",
    blurb:
      "3~5월엔 찬텀 핀네클에 고래상어가 자주 나타나고, 만(灣) 특유의 잔잔한 수면 덕에 프리다이빙 교육이 가장 활발합니다. 10~12월 몬순은 피하세요.",
    water: "수온 28~30°C · 시야 10~25m",
    highlights: ["고래상어", "프리다이빙 코스", "찬텀 핀네클"],
  },
  {
    id: "dahab",
    name: "이집트 다합",
    query: "이집트",
    region: "중동·홍해",
    activities: ["freediving", "scuba"],
    bestMonths: [3, 4, 8, 9, 10],
    shoulderMonths: [2, 5, 11],
    headline: "블루홀 라인다이빙, 봄·가을이 가장 쾌적",
    blurb:
      "프리다이빙 딥 트레이닝의 성지. 한여름은 육상이 너무 덥고 한겨울은 수온이 낮아, 3~5월과 9~11월이 물·날씨 모두 최적입니다.",
    water: "수온 21~28°C · 시야 20~30m",
    highlights: ["블루홀", "딥 트레이닝", "아르추"],
  },
  {
    id: "maldives",
    name: "몰디브 (말레 아톨)",
    query: "몰디브",
    region: "인도양",
    activities: ["scuba", "liveaboard"],
    bestMonths: [11, 0, 1, 2, 3],
    shoulderMonths: [4, 10],
    headline: "건기의 투명한 물, 만타·고래상어 채널 드리프트",
    blurb:
      "북동 몬순 건기(12~4월)에 시야가 40m까지 열리고 채널에 대형 어류가 몰립니다. 남부 아톨의 만타 클리닝 스테이션은 8~11월이 절정.",
    water: "수온 28~30°C · 시야 25~40m",
    highlights: ["만타레이", "고래상어", "채널 드리프트"],
  },
  {
    id: "rajaampat",
    name: "인도네시아 라자암팟",
    query: "인도네시아",
    region: "동남아",
    activities: ["scuba", "liveaboard"],
    bestMonths: [9, 10, 11, 0, 1, 2, 3],
    shoulderMonths: [8],
    headline: "지구상 최고 생물다양성, 잔잔한 시즌은 10~4월",
    blurb:
      "산호 피복률 세계 1위. 10~4월에 바람이 잦아들며 리브어보드 운항이 집중되고, 만타와 월빙 상어를 함께 볼 확률이 높아집니다.",
    water: "수온 28~30°C · 시야 15~30m",
    highlights: ["만타레이", "소프트코랄", "리브어보드"],
  },
  {
    id: "komodo",
    name: "인도네시아 코모도",
    query: "인도네시아",
    region: "동남아",
    activities: ["scuba", "liveaboard"],
    bestMonths: [3, 4, 5, 6, 7, 8, 9, 10],
    shoulderMonths: [2, 11],
    headline: "건기의 강한 조류가 만드는 대형 어류 퍼레이드",
    blurb:
      "4~11월 건기에 조류가 세지면서 만타 포인트와 대형 어류 활동이 활발해집니다. 7~9월엔 남부 수온이 낮아지지만 그만큼 만타가 몰려요.",
    water: "수온 20~29°C · 시야 15~30m",
    highlights: ["만타레이", "조류 다이빙", "핑크비치"],
  },
  {
    id: "palau",
    name: "팔라우 (코로르)",
    query: "팔라우",
    region: "태평양",
    activities: ["scuba"],
    bestMonths: [10, 11, 0, 1, 2, 3, 4],
    shoulderMonths: [5, 9],
    headline: "건기의 저먼 채널, 상어·잭피시 소용돌이",
    blurb:
      "11~5월 건기에 시야가 좋아지고 저먼 채널·블루코너에서 회유성 상어와 바라쿠다·잭피시 소용돌이를 만날 확률이 올라갑니다.",
    water: "수온 28~30°C · 시야 20~35m",
    highlights: ["회색암초상어", "블루코너", "젤리피시 레이크"],
  },
  {
    id: "jeju",
    name: "제주 문섬",
    query: "대한민국",
    region: "국내",
    activities: ["freediving", "scuba"],
    bestMonths: [8, 9, 10],
    shoulderMonths: [5, 6, 7],
    headline: "연산호 군락이 가장 화려한 초가을",
    blurb:
      "9~10월에 수온이 24~26°C까지 올라 시야가 트이고 연산호 색이 진해집니다. 태풍만 피하면 국내에서 가장 이국적인 다이빙.",
    water: "수온 15~26°C · 시야 8~20m",
    highlights: ["연산호", "자리돔떼", "수직벽"],
  },
  {
    id: "gangwon",
    name: "강원 동해 (양양·강릉)",
    query: "대한민국",
    region: "국내",
    activities: ["freediving"],
    bestMonths: [6, 7, 8, 9],
    shoulderMonths: [4, 5, 10],
    headline: "접근성 최고, 여름 수면 프리다이빙 훈련지",
    blurb:
      "6~9월에 수온이 오르고 수면이 잔잔해 당일치기 프리다이빙 훈련에 좋습니다. 수도권에서 가장 빠르게 닿는 딥 트레이닝 포인트.",
    water: "수온 12~24°C · 시야 5~15m",
    highlights: ["당일치기", "딥 트레이닝", "곰치·볼락"],
  },
];

export type SeasonStatus = "peak" | "soon" | "shoulder" | "off";

export const SEASON_STATUS_LABEL: Record<SeasonStatus, string> = {
  peak: "지금이 최적",
  soon: "곧 성수기",
  shoulder: "다이빙 가능",
  off: "비수기",
};

/** month(0-based) 기준으로 해당 포인트의 시즌 상태를 계산 */
export function seasonStatus(spot: DiveSpot, month: number): SeasonStatus {
  if (spot.bestMonths.includes(month)) return "peak";
  const next1 = (month + 1) % 12;
  const next2 = (month + 2) % 12;
  if (spot.bestMonths.includes(next1) || spot.bestMonths.includes(next2)) return "soon";
  if (spot.shoulderMonths.includes(month)) return "shoulder";
  return "off";
}

const STATUS_ORDER: Record<SeasonStatus, number> = { peak: 0, soon: 1, shoulder: 2, off: 3 };

/**
 * 해당 월에 추천할 포인트 목록. 정렬 우선순위:
 * 1) 시즌 상태(최적 > 곧 성수기 > 가능 > 비수기)
 * 2) 해외 포인트 먼저 ("어디로 갈지" 여행 성격이라 국내는 뒤로)
 * 3) 성수기가 짧은 곳 먼저 (그 달에만 반짝 좋은 곳이 더 '지금 갈 이유'가 크다)
 * 4) 가나다순
 * activity가 주어지면 그 액티비티가 가능한 포인트만 남긴다.
 */
export function spotsForMonth(month: number, activity?: ActivityType): (DiveSpot & { status: SeasonStatus })[] {
  return DIVE_SPOTS.filter((s) => !activity || s.activities.includes(activity))
    .map((s) => ({ ...s, status: seasonStatus(s, month) }))
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        Number(a.region === "국내") - Number(b.region === "국내") ||
        a.bestMonths.length - b.bestMonths.length ||
        a.name.localeCompare(b.name, "ko"),
    );
}
