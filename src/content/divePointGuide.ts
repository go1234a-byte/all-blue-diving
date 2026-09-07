/**
 * 다이빙 포인트 가이드 — 웹 랜딩(Landing.tsx) 2번 섹션용 정적 콘텐츠.
 *
 * ⚠️ 예시 콘텐츠입니다. 아래 시즌/수온/해양생물/레벨 정보는 검증되지 않은 일반 상식 수준이며,
 *    게시 전 반드시 직접 확인·수정하세요. TOUR(예약) 데이터와는 무관합니다.
 *
 * 수정 방법:
 *  - DIVE_POINTS 에 포인트를 추가/수정 (image / gallery 는 /public/landing/ 안의 파일명)
 *  - GUIDE_BY_MONTH 의 각 달(0=1월 … 11=12월) 배열에 보여줄 포인트 id 를 나열
 *    (데스크톱 5장 / 모바일 3장 먼저 보이고, 나머지는 "더보기"로 노출됨)
 */

export interface DivePoint {
  id: string;
  /** 지역/국가명 */
  region: string;
  /** 카드 대표 이미지 (/public/landing/) */
  image: string;
  /** 상세 모달용 추가 이미지 */
  gallery: string[];
  /** 한 줄 소개 */
  oneLiner: string;
  /** 그 시기 수온·시야 (예시) */
  water: string;
  /** 만날 수 있는 해양생물 (예시) */
  life: string[];
  /** 추천 다이빙 레벨 (예시) */
  level: string;
  /** 상세 설명 (예시) */
  detail: string;
}

const P = (
  id: string,
  region: string,
  image: string,
  oneLiner: string,
  water: string,
  life: string[],
  level: string,
  detail: string,
  gallery: string[],
): DivePoint => ({ id, region, image, gallery, oneLiner, water, life, level, detail });

export const DIVE_POINTS: Record<string, DivePoint> = {
  rajaampat: P("rajaampat", "라자암팟, 인도네시아", "/landing/coral.jpg",
    "지구상에서 산호·어류 다양성이 가장 높다고 알려진 해역.",
    "수온 28–30°C · 시야 15–30m (예시)", ["만타레이", "월빙 상어", "피그미 시호스"],
    "AOW 이상 · 드리프트 경험 권장",
    "미솔·다양·와이게오 세 구역으로 나뉘며 구역마다 색이 다르다. 조류가 붙는 채널 포인트가 많아 훅·드리프트 스킬이 있으면 훨씬 편하다. 대부분 리브어보드로 접근.",
    ["/landing/turtle.jpg", "/landing/scuba1.jpg"]),
  maldives: P("maldives", "몰디브 (아리·남말레 환초)", "/landing/whale.jpg",
    "환초 채널의 드리프트 다이빙과 대형 회유어가 매력.",
    "수온 27–30°C · 시야 20–40m (예시)", ["만타레이", "고래상어", "회색암초상어"],
    "OW 이상 · 드리프트 익숙하면 좋음",
    "티라(thila)라 불리는 수중 암초와 채널 입구에서 대형 어류가 몰린다. 남부 아리 환초의 만타 포인트, 하니파루 만의 고래상어 시즌이 유명.",
    ["/landing/descend.jpg", "/landing/boat.jpg"]),
  redsea: P("redsea", "홍해 (다합·후르가다), 이집트", "/landing/descend.jpg",
    "블루홀·드롭오프와 연산호 벽으로 유명한 지중해권 관문.",
    "수온 21–28°C · 시야 20–30m (예시)", ["나폴레옹피시", "곰치", "바라쿠다 무리"],
    "OW 이상 · 블루홀 심화는 테크니컬",
    "다합의 블루홀·캐년, 후르가다에서 출항하는 브라더스·데다루스 리프가 대표적. 봄·가을이 육상·수온 모두 쾌적하다.",
    ["/landing/scuba1.jpg", "/landing/coral.jpg"]),
  komodo: P("komodo", "코모도, 인도네시아", "/landing/boat.jpg",
    "강한 조류가 만드는 대형 어류 액션과 만타 포인트.",
    "수온 20–29°C · 시야 15–30m (예시)", ["만타레이", "화이트팁 리프샤크", "몰라몰라(계절)"],
    "AOW 이상 · 강한 조류 대응 필요",
    "북부는 따뜻하고 시야가 좋고, 남부는 수온이 낮은 대신 만타·몰라몰라 확률이 높다. 라부안바조에서 데이트립·리브어보드 모두 가능.",
    ["/landing/whale.jpg", "/landing/turtle.jpg"]),
  sipadan: P("sipadan", "시파단, 말레이시아", "/landing/turtle.jpg",
    "수천 마리 바라쿠다 토네이도와 바다거북 밀도로 손꼽히는 섬.",
    "수온 27–30°C · 시야 15–30m (예시)", ["바다거북", "바라쿠다 토네이도", "잭피시 볼"],
    "OW 이상 · 벽·드리프트 경험 권장",
    "일일 입도 허가가 제한돼 예약이 필수. 인근 마부울·카파라이는 매크로 천국이라 함께 묶어 다닌다.",
    ["/landing/scuba1.jpg", "/landing/coral.jpg"]),
  cebu: P("cebu", "세부 (모알보알·말라파스쿠아), 필리핀", "/landing/scuba1.jpg",
    "정어리 떼와 새벽 환도상어로 알려진 지역.",
    "수온 27–30°C · 시야 10–25m (예시)", ["정어리 떼", "환도상어", "바다거북"],
    "OW 이상 · 말라파스쿠아 새벽 다이빙은 AOW",
    "모알보알 파나그사마 해변의 하우스리프에 정어리 떼가 연중 머문다. 말라파스쿠아 몬나드 숄에서 해뜨기 전 환도상어를 노린다.",
    ["/landing/turtle.jpg", "/landing/descend.jpg"]),
  palau: P("palau", "팔라우", "/landing/group.jpg",
    "블루코너·저먼채널의 상어 라인업과 젤리피시 레이크.",
    "수온 28–30°C · 시야 20–35m (예시)", ["회색암초상어", "만타레이", "나폴레옹피시"],
    "AOW 이상 · 훅 사용 드리프트",
    "블루코너에서 리프훅을 걸고 상어·잭피시 무리를 본다. 2차대전 난파선, 논다이빙 명소 젤리피시 레이크도 유명.",
    ["/landing/descend.jpg", "/landing/coral.jpg"]),
  kohtao: P("kohtao", "코타오, 태국", "/landing/freedive1.jpg",
    "잔잔한 만과 얕은 수심 — 입문·프리다이빙 교육의 메카.",
    "수온 28–30°C · 시야 10–25m (예시)", ["고래상어(계절)", "바다거북", "블루스팟 스팅레이"],
    "체험~강사과정 전 레벨",
    "전 세계에서 오픈워터 자격증을 가장 많이 발급하는 섬 중 하나. 찬텀 핀네클에서 고래상어를 만나기도 한다.",
    ["/landing/coral.jpg", "/landing/turtle.jpg"]),
  galapagos: P("galapagos", "갈라파고스, 에콰도르", "/landing/hero.jpg",
    "차가운 물살 속 대형 원양 생물 — 상급자 리브어보드 위주.",
    "수온 18–26°C · 시야 10–25m (예시)", ["귀상어 무리", "고래상어", "바다이구아나"],
    "100 dives 이상 권장 · 드라이슈트·강조류",
    "다윈·울프 섬은 데이트립이 불가능해 리브어보드로만 간다. 수온이 낮고 조류가 강해 경험이 필요하다.",
    ["/landing/descend.jpg", "/landing/whale.jpg"]),
  socorro: P("socorro", "소코로 (레비야히헤도), 멕시코", "/landing/whale.jpg",
    "‘태평양의 갈라파고스’. 대형 만타가 다이버에게 다가오는 곳.",
    "수온 21–27°C · 시야 20–30m (예시)", ["대형 만타", "혹등고래(계절)", "실키·해머헤드 상어"],
    "AOW + 50 dives 이상 · 리브어보드",
    "카보산루카스에서 24시간 항해해 들어간다. 만타가 버블에 반응해 다이버 주위를 맴도는 인터랙션으로 유명.",
    ["/landing/descend.jpg", "/landing/group.jpg"]),
  similan: P("similan", "시밀란 제도, 태국", "/landing/coral.jpg",
    "화강암 바위 지형과 소프트코랄. 안다만해 대표 코스.",
    "수온 27–30°C · 시야 15–30m (예시)", ["만타레이", "고래상어", "레오파드 샤크"],
    "OW 이상",
    "11월~4월에만 국립공원이 개방된다. 리처리우 록·코본에서 만타·고래상어 확률이 올라간다.",
    ["/landing/scuba1.jpg", "/landing/turtle.jpg"]),
  lembeh: P("lembeh", "렘베 해협, 인도네시아", "/landing/scuba1.jpg",
    "세계 최고의 머크(muck) 다이빙 — 희귀 생물 사진가의 성지.",
    "수온 26–29°C · 시야 8–15m (예시)", ["프로그피시", "밈익 옥토퍼스", "블루링 옥토퍼스"],
    "OW 이상 · 중성부력·카메라 컨트롤",
    "검은 모래 바닥에서 위장 생물을 찾아내는 다이빙. 화려한 지형은 없지만 생물 다양성으로는 독보적.",
    ["/landing/coral.jpg", "/landing/descend.jpg"]),
  bali: P("bali", "발리 (툴람벤·누사페니다), 인도네시아", "/landing/turtle.jpg",
    "난파선 스노클링부터 몰라몰라·만타까지 스펙트럼이 넓다.",
    "수온 22–29°C · 시야 10–30m (예시)", ["몰라몰라(계절)", "만타레이", "바다거북"],
    "체험~AOW",
    "툴람벤 USAT 리버티 난파선은 해변에서 걸어 들어간다. 누사페니다는 7~10월 몰라몰라 시즌.",
    ["/landing/scuba1.jpg", "/landing/group.jpg"]),
};

/** 달(0=1월 … 11=12월)별로 보여줄 포인트 id 목록 — 예시. 게시 전 확인 필요. (데스크톱 5 / 모바일 3 먼저, 나머지 더보기) */
export const GUIDE_BY_MONTH: string[][] = [
  ["rajaampat", "maldives", "kohtao", "sipadan", "similan", "lembeh", "bali"], // 1월
  ["rajaampat", "maldives", "cebu", "palau", "similan", "socorro", "lembeh"], // 2월
  ["redsea", "maldives", "cebu", "kohtao", "similan", "socorro", "bali"], // 3월
  ["redsea", "komodo", "cebu", "galapagos", "similan", "socorro", "lembeh"], // 4월
  ["redsea", "komodo", "sipadan", "galapagos", "socorro", "lembeh", "bali"], // 5월
  ["komodo", "sipadan", "galapagos", "kohtao", "lembeh", "palau", "bali"], // 6월
  ["komodo", "sipadan", "galapagos", "kohtao", "bali", "lembeh", "cebu"], // 7월
  ["komodo", "sipadan", "galapagos", "cebu", "bali", "palau", "lembeh"], // 8월
  ["redsea", "komodo", "sipadan", "galapagos", "bali", "lembeh", "cebu"], // 9월
  ["redsea", "komodo", "palau", "cebu", "sipadan", "lembeh", "maldives"], // 10월
  ["rajaampat", "redsea", "palau", "maldives", "similan", "kohtao", "lembeh"], // 11월
  ["rajaampat", "maldives", "palau", "kohtao", "similan", "sipadan", "lembeh"], // 12월
];
