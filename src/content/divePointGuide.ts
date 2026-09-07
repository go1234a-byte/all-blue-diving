/**
 * 다이빙 포인트 가이드 — 웹 랜딩(Landing.tsx) 2번 섹션용 정적 콘텐츠.
 *
 * ⚠️ 예시 콘텐츠 — 게시 전 확인 필요.
 *    아래 시즌·수온·시야·해양생물·레벨은 다이빙 업계 자료를 참고한 일반적인 정보이며,
 *    연도별로 조건이 달라질 수 있습니다. 실제 게시 전 최신 정보로 재확인하세요.
 *    TOUR(예약) 데이터와는 무관합니다.
 *
 * 수정 방법:
 *  - DIVE_POINTS 에 포인트를 추가/수정 (image / gallery 는 /public/landing/ 안의 파일명)
 *  - GUIDE_BY_MONTH 의 각 달(0=1월 … 11=12월) 배열에 보여줄 포인트 id 를 나열
 *    (데스크톱 5장 / 모바일 3장 먼저 보이고, 나머지는 "더보기"로 노출됨)
 */

export interface DivePoint {
  id: string;
  region: string;
  image: string;
  gallery: string[];
  /** 한 줄 소개 (그 시기가 왜 좋은지) */
  oneLiner: string;
  /** 수온·시야 (예시) */
  water: string;
  /** 만날 수 있는 해양생물 (예시) */
  life: string[];
  /** 추천 다이빙 레벨 (예시) */
  level: string;
  /** 상세 설명 (예시) */
  detail: string;
  /** 지역 내 대표 다이빙 포인트 (예시) */
  points: { name: string; desc: string }[];
}

const P = (
  id: string, region: string, image: string, oneLiner: string, water: string,
  life: string[], level: string, detail: string, gallery: string[],
  points: { name: string; desc: string }[],
): DivePoint => ({ id, region, image, gallery, oneLiner, water, life, level, detail, points });

export const DIVE_POINTS: Record<string, DivePoint> = {
  maldives: P("maldives", "몰디브 (센트럴 아톨)", "/landing/whale.jpg",
    "바다가 잔잔하고 시야가 맑아지는 시기 — 만타레이·고래상어·리프샤크 확률이 높다.",
    "수온 27–30°C · 시야 20–30m (예시)", ["만타레이", "고래상어", "회색암초상어"],
    "OW 이상 · 채널 드리프트 익숙하면 좋음",
    "북·남 말레 아톨의 티라(수중 암초)와 채널 입구에서 대형 어류가 몰린다. 건기(대략 12~4월)에 시야가 트인다.",
    ["/landing/descend.jpg", "/landing/boat.jpg"],
    [{ name: "마아미기리 티라", desc: "아리 환초 남부의 대표 만타 클리닝 스테이션." }, { name: "피시헤드(무시마스미기리)", desc: "보호구역. 회색암초상어가 상주하는 채널 포인트." }, { name: "HP 리프", desc: "북말레의 완만한 드리프트, 만타·이글레이 관찰" }]),
  maldives_baa: P("maldives_baa", "몰디브 바·라 아톨 (하니파루 베이)", "/landing/whale.jpg",
    "만타레이·고래상어가 대규모로 모이는 성수기(대략 8~10월).",
    "수온 27–29°C · 시야 10–20m (예시)", ["만타레이 떼", "고래상어"],
    "OW 이상 · 스노클/스킨다이빙 중심 구간 있음",
    "하니파루 베이는 플랑크톤이 몰리는 시기에 만타 클리닝·피딩이 대규모로 일어난다. 보호구역이라 다이빙 방식이 제한된다.",
    ["/landing/descend.jpg", "/landing/coral.jpg"],
    [{ name: "하니파루 베이", desc: "플랑크톤 시즌에 만타 수십 마리가 피딩. 스노클 전용 구간." }, { name: "디가리 티라", desc: "바 환초의 만타 클리닝 스테이션." }, { name: "네라반두 티라", desc: "연산호 벽과 대형 어군" }]),
  galapagos: P("galapagos", "갈라파고스, 에콰도르", "/landing/hero.jpg",
    "해머헤드 샤크·만타레이, 간혹 고래상어까지 — 조류가 강해 숙련자용.",
    "수온 18–26°C · 시야 10–25m (예시)", ["귀상어 무리", "고래상어", "바다이구아나"],
    "100 dives 이상 권장 · 강조류·드라이슈트",
    "다윈·울프 섬은 데이트립이 불가능해 리브어보드로만 간다. 수온이 낮고 조류가 강하다.",
    ["/landing/descend.jpg", "/landing/whale.jpg"],
    [{ name: "다윈 아치", desc: "해머헤드·고래상어가 몰리는 세계적 포인트. 강조류." }, { name: "울프 섬", desc: "귀상어 스쿨링과 갈라파고스 상어." }, { name: "카보 마샬", desc: "만타레이와 몰라몰라" }]),
  mafia: P("mafia", "탄자니아 · 마피아 섬", "/landing/turtle.jpg",
    "고래상어를 만나기 좋은 시기 중 하나(대략 10월~2월).",
    "수온 25–29°C · 시야 10–20m (예시)", ["고래상어", "바다거북", "그루퍼"],
    "OW 이상",
    "마피아 해협에서 고래상어가 표층 플랑크톤을 먹으러 올라온다. 스노클/스킨다이빙으로 접근하는 경우가 많다.",
    ["/landing/scuba1.jpg", "/landing/coral.jpg"],
    [{ name: "키탕가니 월", desc: "드롭오프를 따라가는 벽 다이빙." }, { name: "초레 베이", desc: "고래상어 표층 피딩(스노클)." }]),
  tubbataha: P("tubbataha", "필리핀 · 투바타하 리프", "/landing/coral.jpg",
    "리브어보드로만 접근하는 유네스코 산호초. 3월 중순~6월 중순 시즌, 4월이 특히 시야가 좋다.",
    "수온 28–30°C · 시야 25–40m (예시)", ["회색암초상어", "바다거북", "잭피시 볼"],
    "AOW 이상 · 벽·드리프트",
    "노스·사우스 아톨의 수직 벽과 제슬리 셔벌 리프를 돈다. 개방 기간이 짧아 예약 경쟁이 치열하다.",
    ["/landing/turtle.jpg", "/landing/descend.jpg"],
    [{ name: "셔벌 리프", desc: "여울에 걸린 난파선과 상어 어군." }, { name: "델산 렉", desc: "경사면을 따라 내려가는 벽, 잭피시 볼." }, { name: "워싱 머신", desc: "이름대로 조류가 강한 코너 포인트" }]),
  palau: P("palau", "팔라우", "/landing/group.jpg",
    "산호 산란 시기와 맞물려 시야가 좋고, 블루코너·저먼채널에서 나폴레옹·상어·만타.",
    "수온 28–30°C · 시야 20–35m (예시)", ["회색암초상어", "만타레이", "나폴레옹피시"],
    "AOW 이상 · 리프훅 드리프트",
    "블루코너에서 훅을 걸고 상어·잭피시 무리를 본다. 젤리피시 레이크 등 논다이빙 명소도 유명.",
    ["/landing/descend.jpg", "/landing/coral.jpg"],
    [{ name: "블루코너", desc: "리프훅을 걸고 상어·바라쿠다·잭피시를 보는 시그니처 포인트." }, { name: "저먼채널", desc: "만타 클리닝 스테이션, 이른 아침이 좋다." }, { name: "뉴드롭오프", desc: "수직 벽과 회유성 어류" }]),
  redsea: P("redsea", "이집트 홍해 (남부)", "/landing/descend.jpg",
    "바다가 따뜻하고 잔잔해지는 시기 — 브라더스·다이달루스·엘핀스톤 리브어보드 시즌이 무르익는다.",
    "수온 24–29°C · 시야 20–30m (예시)", ["오세아닉 화이트팁", "귀상어", "스레셔 샤크"],
    "AOW 이상 · 원양 상어 다이빙",
    "여름 전후가 특히 따뜻하고 잔잔하다. 북부(난파선) 코스와는 성격이 완전히 다르다.",
    ["/landing/scuba1.jpg", "/landing/coral.jpg"],
    [{ name: "빅 브라더", desc: "난파선 아이다·누미디아와 스레셔·오세아닉 화이트팁." }, { name: "다이달루스 리프", desc: "해머헤드 스쿨링과 아넴네 시티." }, { name: "엘핀스톤", desc: "가파른 리프와 오세아닉 화이트팁" }]),
  cocos: P("cocos", "코스타리카 · 코코스섬", "/landing/descend.jpg",
    "해머헤드 샤크 무리가 몰려드는 시기. 강한 조류가 있어 숙련자 대상.",
    "수온 24–28°C · 시야 10–25m (예시)", ["귀상어 무리", "갈라파고스 상어", "만타레이"],
    "50 dives 이상 · 강조류 · 리브어보드",
    "푼타레나스에서 30여 시간 항해해 들어간다. 클리닝 스테이션 주변에서 해머헤드 스쿨링을 노린다.",
    ["/landing/whale.jpg", "/landing/group.jpg"],
    [{ name: "바하 알시온", desc: "해머헤드 클리닝 스테이션. 강조류." }, { name: "디르티 록", desc: "상어와 대형 어군이 모이는 바위 지형." }, { name: "맨루엘라", desc: "화이트팁 리프샤크 나이트 다이빙" }]),
  komodo: P("komodo", "인도네시아 · 코모도", "/landing/boat.jpg",
    "역동적인 지형과 대형 해양생물 — 강한 조류가 만드는 어류 액션.",
    "수온 20–29°C · 시야 15–30m (예시)", ["만타레이", "화이트팁 리프샤크", "몰라몰라(계절)"],
    "AOW 이상 · 강한 조류 대응",
    "북부는 따뜻하고 시야가 좋고, 남부는 수온이 낮은 대신 만타·몰라몰라 확률이 높다.",
    ["/landing/whale.jpg", "/landing/turtle.jpg"],
    [{ name: "바투 볼롱", desc: "조류에 씻긴 작은 바위, 어군 밀도 최고 수준." }, { name: "카스텔로", desc: "경사면과 만타 통로." }, { name: "마나타 앨리", desc: "이름대로 만타가 줄지어 지나는 클리닝 스테이션" }]),
  seychelles: P("seychelles", "세이셸", "/landing/coral.jpg",
    "상어 다이빙을 만나기 좋은 시기.",
    "수온 26–29°C · 시야 15–25m (예시)", ["고래상어", "너스 샤크", "매부리바다거북"],
    "OW 이상",
    "마헤·프라슬랭 주변의 화강암 지형과 수중 바위. 시즌에 따라 고래상어가 붙는다.",
    ["/landing/turtle.jpg", "/landing/scuba1.jpg"],
    [{ name: "셰크 뱅크", desc: "마헤 인근의 상어 포인트." }, { name: "브리시어 록", desc: "화강암 지형과 매부리바다거북" }]),
  oman: P("oman", "오만", "/landing/whale.jpg",
    "고래상어를 만나기 좋은 시기.",
    "수온 24–30°C · 시야 10–20m (예시)", ["고래상어", "쥐가오리 떼", "바다거북"],
    "OW 이상",
    "무스카트 인근 다이마니야 제도 등에서 시즌에 고래상어와 대형 쥐가오리 떼가 관찰된다.",
    ["/landing/descend.jpg", "/landing/group.jpg"],
    [{ name: "다이마니야 제도", desc: "고래상어와 대형 쥐가오리 떼." }, { name: "포클랜드 아일랜드", desc: "연산호와 어군" }]),
  sipadan: P("sipadan", "말레이시아 · 시파단", "/landing/turtle.jpg",
    "바라쿠다 토네이도와 거북이로 유명. 하루 입장 인원이 제한돼 사전 계획이 필요하다.",
    "수온 27–30°C · 시야 15–30m (예시)", ["바다거북", "바라쿠다 토네이도", "잭피시 볼"],
    "OW 이상 · 벽·드리프트 경험 권장",
    "입도 허가 수가 제한된다. 인근 마부울·카파라이는 매크로 천국이라 함께 묶어 다닌다.",
    ["/landing/scuba1.jpg", "/landing/coral.jpg"],
    [{ name: "바라쿠다 포인트", desc: "수천 마리 바라쿠다 토네이도로 유명." }, { name: "드롭오프", desc: "선착장 바로 앞의 수직 벽, 거북이 밀도 높음." }, { name: "사우스 포인트", desc: "해머헤드가 지나는 깊은 코너" }]),
  rajaampat: P("rajaampat", "인도네시아 · 라자암팟", "/landing/coral.jpg",
    "건기라 바다가 잔잔하고 만타레이를 만나기 좋다. 10~12월엔 미솔 지역까지 방문하기 좋다.",
    "수온 28–30°C · 시야 15–30m (예시)", ["만타레이", "월빙 상어", "피그미 시호스"],
    "AOW 이상 · 드리프트 경험 권장",
    "담피어 해협·미솔·와이게오로 나뉘며 구역마다 색이 다르다. 대부분 리브어보드로 접근한다.",
    ["/landing/turtle.jpg", "/landing/scuba1.jpg"],
    [{ name: "블루매직", desc: "담피어 해협의 대표 포인트. 만타와 대형 어군." }, { name: "케이프 크리", desc: "생물 다양성이 가장 높다고 알려진 하우스 리프." }, { name: "멜리사스 가든", desc: "형형색색 소프트코랄 정원" }]),
  similan: P("similan", "태국 · 시밀란 제도", "/landing/coral.jpg",
    "다이빙 시즌이 시작되는 시기(대략 10월 중순~5월 중순). 리치엘리유 록이 하이라이트.",
    "수온 27–30°C · 시야 15–30m (예시)", ["만타레이", "고래상어", "레오파드 샤크"],
    "OW 이상",
    "화강암 바위 지형과 소프트코랄. 코본에서 만타, 리치엘리유 록에서 화려한 연산호·매크로.",
    ["/landing/scuba1.jpg", "/landing/turtle.jpg"],
    [{ name: "리치엘리유 록", desc: "안다만해 최고의 매크로·연산호 포인트, 고래상어 가능." }, { name: "엘리펀트 헤드 록", desc: "바위 사이를 지나는 스윔스루." }, { name: "코본(사우스)", desc: "만타 클리닝 스테이션" }]),
  socorro: P("socorro", "멕시코 · 소코로 (레비야히헤도)", "/landing/whale.jpg",
    "리브어보드 시즌 시작(대략 11월~6월). 대형 오세아닉 만타레이와 귀상어 무리.",
    "수온 21–27°C · 시야 20–30m (예시)", ["대형 만타", "혹등고래(1~3월)", "실키·해머헤드 상어"],
    "AOW + 50 dives 이상 · 리브어보드",
    "카보산루카스에서 24시간 항해. 만타가 버블에 반응해 다이버 주위를 맴도는 인터랙션으로 유명.",
    ["/landing/descend.jpg", "/landing/group.jpg"],
    [{ name: "더 보일러", desc: "산베네딕토의 해산. 대형 만타 인터랙션의 상징 포인트." }, { name: "카보 피어스", desc: "돌고래와 실키 상어." }, { name: "로카 파르티다", desc: "해머헤드·갈라파고스 상어가 도는 고립 바위" }]),
};

/** 달(0=1월 … 11=12월)별 추천 포인트 id — 예시. 게시 전 확인 필요. (데스크톱 5 / 모바일 3 먼저, 나머지 더보기) */
export const GUIDE_BY_MONTH: string[][] = [
  ["maldives", "galapagos", "rajaampat", "similan", "socorro", "sipadan", "mafia"], // 1월
  ["maldives", "mafia", "rajaampat", "similan", "socorro", "palau", "tubbataha"], // 2월
  ["tubbataha", "rajaampat", "similan", "socorro", "redsea", "maldives", "palau"], // 3월
  ["tubbataha", "rajaampat", "similan", "socorro", "redsea", "palau", "komodo"], // 4월
  ["palau", "tubbataha", "redsea", "rajaampat", "socorro", "komodo", "sipadan"], // 5월
  ["redsea", "komodo", "cocos", "palau", "sipadan", "socorro", "seychelles"], // 6월
  ["cocos", "komodo", "sipadan", "redsea", "palau", "seychelles", "oman"], // 7월
  ["komodo", "maldives_baa", "sipadan", "cocos", "seychelles", "oman", "rajaampat"], // 8월
  ["seychelles", "oman", "maldives_baa", "komodo", "sipadan", "rajaampat", "redsea"], // 9월
  ["sipadan", "maldives_baa", "rajaampat", "komodo", "similan", "redsea", "mafia"], // 10월
  ["similan", "socorro", "rajaampat", "maldives", "sipadan", "palau", "mafia"], // 11월
  ["similan", "socorro", "rajaampat", "maldives", "redsea", "palau", "mafia"], // 12월
];
