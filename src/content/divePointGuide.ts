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

  // ── 카리브해 ──────────────────────────────────────────
  bonaire: P("bonaire", "카리브해 · 보네르", "/landing/coral.jpg",
    "잔잔한 서안과 촘촘한 해안 진입 포인트 — 셀프가이드 쇼어 다이빙의 성지.",
    "수온 26–29°C · 시야 20–30m (예시)", ["매부리바다거북", "타폰", "프렌치엔젤피시"],
    "OW 이상 · 쇼어 다이빙",
    "섬 전체가 해양보호구역이라 리프가 건강하다. 대부분 해안에서 걸어 들어가는 쇼어 다이빙이며 야간 다이빙도 활발하다.",
    ["/landing/scuba1.jpg", "/landing/turtle.jpg"],
    [{ name: "솔트 피어", desc: "산호로 뒤덮인 부두 기둥 사이로 대형 어군과 바다거북을 만나는 초보자 친화적 포인트." },
     { name: "1000 스텝", desc: "계단을 내려가 만나는 매부리바다거북과 완만한 산호 경사면." },
     { name: "힐마 후커 난파선", desc: "18~30m에 가라앉은 유명 난파선, 진입이 쉬운 렉 다이빙." }]),
  cayman: P("cayman", "케이맨 제도", "/landing/descend.jpg",
    "20피트에서 시작해 1,000피트 이상 이어지는 극적인 드롭오프 월과 얕은 가오리 명소.",
    "수온 26–29°C · 시야 25–40m (예시)", ["가오리 떼", "매부리바다거북", "너스 샤크"],
    "OW 이상 · 벽 다이빙",
    "리틀 케이맨의 블러디 베이 월은 세계적으로 손꼽히는 벽 다이빙이다. 그랜드 케이맨의 스팅레이 시티는 스노클로도 유명하다.",
    ["/landing/coral.jpg", "/landing/turtle.jpg"],
    [{ name: "블러디 베이 월(리틀 케이맨)", desc: "20피트에서 시작해 1,000피트 이상 떨어지는 드롭오프 월 다이빙." },
     { name: "스팅레이 시티(그랜드 케이맨)", desc: "얕은 모래바닥에서 가오리떼와 교감하는 명소." }]),
  belize: P("belize", "벨리즈", "/landing/hero.jpg",
    "자크 쿠스토가 소개한 지름 300m의 싱크홀 그레이트 블루홀과 그 주변 리프.",
    "수온 26–29°C · 시야 15–30m (예시)", ["카리브해 리프샤크", "너스 샤크", "그루퍼"],
    "AOW 이상 · 딥·리브어보드",
    "블루홀은 40m 부근의 거대한 석순 지형을 보는 딥 다이빙이다. 라이트하우스 리프의 다른 포인트들이 다이빙의 본편에 가깝다.",
    ["/landing/descend.jpg", "/landing/coral.jpg"],
    [{ name: "그레이트 블루홀", desc: "지름 300m의 싱크홀, 40m 부근 석순 지형과 카리브해 리프샤크." },
     { name: "라이트하우스 리프", desc: "그레이트 블루홀 주변의 다양한 리프 다이빙 포인트." }]),

  // ── 태평양 ────────────────────────────────────────────
  fiji: P("fiji", "피지", "/landing/coral.jpg",
    "\"소프트코랄의 수도\"로 불리는 화려한 연산호와 최대 8종의 상어를 만나는 샤크 다이브.",
    "수온 25–29°C · 시야 15–30m (예시)", ["불샤크", "타이거샤크", "만타레이"],
    "AOW 이상 · 드리프트·상어 다이빙",
    "베카 라군의 상어 다이브와 소마소마 해협의 연산호 벽이 대표적이다. 건기(대략 5~10월)에 시야가 좋다.",
    ["/landing/descend.jpg", "/landing/scuba1.jpg"],
    [{ name: "레인보우 리프(그레이트 화이트 월)", desc: "\"소프트코랄 월드\"라 불리는 화려한 연산호 벽." },
     { name: "베카 라군 샤크 다이브", desc: "불샤크·타이거샤크 등 최대 8종의 상어를 만나는 다이빙." },
     { name: "야사와 제도", desc: "만타레이와 만날 수 있는 드리프트 다이빙." }]),
  frenchpolynesia: P("frenchpolynesia", "프랑스령 폴리네시아 (파카라바·랑기로아)", "/landing/scuba1.jpg",
    "수백 마리 회색 리프상어가 벽을 이루는 \"샤크월\"과 채널 드리프트.",
    "수온 26–29°C · 시야 20–40m (예시)", ["회색암초상어 떼", "돌고래", "만타레이"],
    "AOW 이상 · 강조류 드리프트",
    "파카라바 남쪽 패스는 상어 밀도가 세계 최고 수준이다. 6~7월 그루퍼 산란기에 상어가 특히 몰린다.",
    ["/landing/descend.jpg", "/landing/whale.jpg"],
    [{ name: "투마코후아 패스(파카라바, \"샤크월\")", desc: "수백 마리의 회색 리프상어가 벽을 이루는 세계적 명소." },
     { name: "티푸타 패스(랑기로아)", desc: "상어·돌고래·만타레이를 만나는 드리프트, 8~10월엔 고래 이동도 관찰." }]),

  // ── 인도네시아 마크로 ─────────────────────────────────
  lembeh: P("lembeh", "인도네시아 · 렘베 해협", "/landing/turtle.jpg",
    "검은 모래 바닥에서 희귀 마크로 생물을 찾는 \"머크 다이빙의 성지\".",
    "수온 26–29°C · 시야 8–15m (예시)", ["프로그피시", "피그미 시호스", "미믹 옥토퍼스"],
    "OW 이상 · 마크로·수중 사진",
    "볼거리는 넓은 풍경이 아니라 손바닥만 한 생물이다. 슬로우 다이빙과 사진 촬영에 최적화돼 있다.",
    ["/landing/coral.jpg", "/landing/scuba1.jpg"],
    [{ name: "히어러스 락", desc: "프로그피시·리프피시가 상주하는 대표 머크 포인트." },
     { name: "누디 폴스", desc: "이름대로 갯민숭달팽이가 많은 경사면." },
     { name: "TK(테루살라)", desc: "미믹·완더퍼스 등 문어류가 유명한 검은 모래밭." }]),

  // ── 아프리카 ──────────────────────────────────────────
  aliwal: P("aliwal", "남아프리카공화국 · 알리왈 숄", "/landing/instructor.jpg",
    "라기드투스 샤크(누사상어)가 무리 짓는 암초와, 6~7월의 사딘 런.",
    "수온 17–24°C · 시야 8–20m (예시)", ["누사상어", "타이거샤크", "귀상어"],
    "AOW 이상 · 서지·상어 다이빙",
    "겨울(대략 6~11월)에 누사상어가 케이브 주변에 모인다. 인근 포트세인트존스의 사딘 런은 숙련자 대상 오션 사파리다.",
    ["/landing/descend.jpg", "/landing/whale.jpg"],
    [{ name: "래기스 케이브", desc: "라기드투스 샤크(누사상어)가 무리 짓는 포인트." },
     { name: "샤크 앨리", desc: "타이거샤크·귀상어 등 다양한 상어를 만나는 곳." },
     { name: "사딘 런(6~7월, 포트세인트존스)", desc: "수백만 마리 정어리떼를 쫓는 돌고래·상어·고래의 장관. 숙련자 대상." }]),
  mozambique: P("mozambique", "모잠비크 · 토포", "/landing/whale.jpg",
    "3곳의 클리닝 스테이션에서 만타레이를 연중 만나고, 10~3월엔 고래상어까지.",
    "수온 24–28°C · 시야 10–20m (예시)", ["만타레이", "고래상어", "혹등고래(계절)"],
    "OW 이상 · 서프 런치 보트",
    "토푸 베이는 아프리카 동안에서 만타 확률이 가장 높은 곳으로 꼽힌다. 해변에서 보트를 밀어 나가는 서프 런치가 특징.",
    ["/landing/descend.jpg", "/landing/scuba1.jpg"],
    [{ name: "만타 리프", desc: "3곳의 클리닝 스테이션에서 만타레이를 연중 관찰." },
     { name: "웨일샤크 앨리", desc: "10~3월 고래상어가 자주 출몰하는 표층 구역." }]),
  sudan: P("sudan", "수단 홍해", "/landing/descend.jpg",
    "자크 쿠스토가 콘셸프 II 해저기지를 세웠던 전설적인 리프, 상어가 도는 원시 산호초.",
    "수온 25–30°C · 시야 20–40m (예시)", ["회색암초상어 떼", "귀상어", "만타레이"],
    "AOW 이상 · 리브어보드",
    "포트수단에서 출항하는 리브어보드로만 접근한다. 다이버가 적어 홍해 중에서도 원시적인 상태가 남아 있다.",
    ["/landing/coral.jpg", "/landing/scuba1.jpg"],
    [{ name: "샤압 루미", desc: "쿠스토의 콘셸프 II 잔해와 대규모 회색리프상어·귀상어." },
     { name: "산가네브", desc: "외해에 솟은 환초, 해머헤드와 대형 어군." }]),

  // ── 호주 ──────────────────────────────────────────────
  gbr: P("gbr", "호주 · 그레이트 배리어 리프", "/landing/coral.jpg",
    "세계 최고로 꼽히는 난파선 SS 용갈라와 리본리프의 코드홀.",
    "수온 23–29°C · 시야 15–30m (예시)", ["대형 그루퍼", "만타레이", "밍크고래(6~7월)"],
    "AOW 이상 · 렉·리브어보드",
    "타운즈빌 앞바다의 용갈라는 어류 밀도가 압도적이다. 북부 리본리프는 6~7월 드워프 밍크고래 시즌으로 유명하다.",
    ["/landing/scuba1.jpg", "/landing/turtle.jpg"],
    [{ name: "SS 용갈라 난파선", desc: "1911년 침몰선, 세계 최고의 난파선 다이빙으로 꼽히며 대형 그루퍼·만타." },
     { name: "코드홀(리본리프)", desc: "대형 포테이토 코드와 친해질 수 있는 유명 포인트." }]),
  ningaloo: P("ningaloo", "호주 · 닝갈루 리프 (서호주)", "/landing/whale.jpg",
    "3~7월 고래상어가 몰려드는 세계적인 고래상어 스노클·다이빙 명소.",
    "수온 22–27°C · 시야 15–25m (예시)", ["고래상어", "만타레이", "혹등고래(8~10월)"],
    "OW 이상 · 스노클 중심 구간",
    "해안에서 헤엄쳐 닿는 프린징 리프가 특징이다. 고래상어는 스폿터 비행기로 찾아 스노클로 접근한다.",
    ["/landing/descend.jpg", "/landing/scuba1.jpg"],
    [{ name: "닝갈루 리프", desc: "3~7월 고래상어, 연중 만타레이를 만나는 프린징 리프." }]),

  // ── 유럽 ──────────────────────────────────────────────
  silfra: P("silfra", "아이슬란드 · 실프라", "/landing/hero.jpg",
    "북미판과 유라시아판 사이를 지나는, 빙하수 기반 100m 이상 시야의 균열.",
    "수온 2–4°C · 시야 80–100m+ (예시)", ["대형 생물 없음 — 지질·시야가 주인공"],
    "드라이슈트 인증 필수 · 저수온",
    "싱벨리르 국립공원의 담수 균열이다. 수온이 늘 2~4°C라 드라이슈트가 필수이며, 시야는 세계 최고 수준이다.",
    ["/landing/descend.jpg", "/landing/coral.jpg"],
    [{ name: "실프라 균열 (빅 크랙~캐시드럴~라군)", desc: "두 대륙판 사이를 지나는 세계 유일의 다이빙, 100m 이상 시야." }]),
  malta: P("malta", "몰타 · 고조", "/landing/descend.jpg",
    "역사적인 2차대전 난파선과 상징적인 동굴·아치 지형.",
    "수온 16–26°C · 시야 20–40m (예시)", ["바라쿠다", "그루퍼", "문어"],
    "OW 이상 · 렉·쇼어 다이빙",
    "여름(대략 5~10월)에 시야가 가장 좋다. 쇼어 다이빙 인프라가 잘 갖춰져 있고 난파선 수가 많다.",
    ["/landing/coral.jpg", "/landing/scuba1.jpg"],
    [{ name: "블루홀 (고조)", desc: "12m 웅덩이에서 시작해 아치를 통과해 바다로 나가는 상징적 포인트." },
     { name: "2차대전 난파선 (움 엘 파룻 등)", desc: "몰타 전역에 흩어진 대형 침몰선 렉 다이빙." }]),
  azores: P("azores", "아조레스, 포르투갈", "/landing/whale.jpg",
    "대양 한가운데 솟은 해산에 만타·모블라·블루샤크가 모이는 \"유럽의 숨은 보석\".",
    "수온 17–24°C · 시야 20–30m (예시)", ["모블라(쥐가오리)", "블루샤크", "마코샤크"],
    "AOW 이상 · 블루워터·해산 다이빙",
    "7~10월에 프린세스 앨리스 뱅크 등 외해 해산에서 대형 어류가 모인다. 케이지 없이 블루워터에서 상어를 만나는 다이빙도 운영된다.",
    ["/landing/descend.jpg", "/landing/scuba1.jpg"],
    [{ name: "프린세스 앨리스 뱅크", desc: "수면 아래 35m 해산에 모블라(쥐가오리) 떼가 모이는 대표 포인트." },
     { name: "블루샤크·마코 다이빙", desc: "외해에서 케이지 없이 원양 상어를 만나는 블루워터 다이빙." }]),

  // ── 홍해 북부 데이트립 (리브어보드와 별개) ────────────
  redsea_north: P("redsea_north", "이집트 홍해 (북부 · 데이트립)", "/landing/scuba1.jpg",
    "라스무함마드의 리프·난파선과 티란 해협 — 리브어보드가 아니어도 당일로 닿는 홍해.",
    "수온 21–29°C · 시야 20–30m (예시)", ["바라쿠다·트레발리 떼", "그루퍼", "리프샤크"],
    "OW 이상 (일부 렉은 AOW)",
    "샤름엘셰이크·후르가다에서 당일 보트로 다닌다. 여름에 라스무함마드 리프에 대형 어군이 붙는다.",
    ["/landing/coral.jpg", "/landing/descend.jpg"],
    [{ name: "샤크&욜란다 리프", desc: "3개의 산호 첨탑과 욜란다호 화물 잔해, 여름철 대형 어군." },
     { name: "잭슨 리프 (티란 해협)", desc: "참치·바라쿠다·트레발리가 모이는 다양성 높은 리프, 인근에 난파선 라라." },
     { name: "티스틀곰 난파선", desc: "2차대전 당시 침몰한 영국 화물선, 세계적으로 유명한 난파선 다이빙." }]),
};

/** 달(0=1월 … 11=12월)별 추천 포인트 id — 예시. 게시 전 확인 필요. (데스크톱 5 / 모바일 3 먼저, 나머지 더보기) */
export const GUIDE_BY_MONTH: string[][] = [
  ["maldives", "galapagos", "rajaampat", "similan", "socorro", "sipadan", "mafia", "bonaire", "cayman", "belize", "mozambique"], // 1월
  ["maldives", "mafia", "rajaampat", "similan", "socorro", "palau", "tubbataha", "bonaire", "cayman", "belize", "mozambique"], // 2월
  ["tubbataha", "rajaampat", "similan", "socorro", "redsea", "maldives", "palau", "ningaloo", "bonaire", "sudan", "redsea_north"], // 3월
  ["tubbataha", "rajaampat", "similan", "socorro", "redsea", "palau", "komodo", "ningaloo", "fiji", "sudan", "redsea_north"], // 4월
  ["palau", "tubbataha", "redsea", "rajaampat", "socorro", "komodo", "sipadan", "ningaloo", "fiji", "silfra", "malta", "redsea_north"], // 5월
  ["redsea", "komodo", "cocos", "palau", "sipadan", "socorro", "seychelles", "ningaloo", "gbr", "aliwal", "frenchpolynesia", "silfra", "malta", "redsea_north"], // 6월
  ["cocos", "komodo", "sipadan", "redsea", "palau", "seychelles", "oman", "ningaloo", "gbr", "aliwal", "frenchpolynesia", "azores", "silfra", "malta", "lembeh", "redsea_north"], // 7월
  ["komodo", "maldives_baa", "sipadan", "cocos", "seychelles", "oman", "rajaampat", "gbr", "aliwal", "frenchpolynesia", "azores", "malta", "lembeh", "sudan", "redsea_north"], // 8월
  ["seychelles", "oman", "maldives_baa", "komodo", "sipadan", "rajaampat", "redsea", "aliwal", "frenchpolynesia", "azores", "malta", "lembeh", "sudan", "redsea_north"], // 9월
  ["sipadan", "maldives_baa", "rajaampat", "komodo", "similan", "redsea", "mafia", "aliwal", "frenchpolynesia", "azores", "lembeh", "mozambique", "sudan"], // 10월
  ["similan", "socorro", "rajaampat", "maldives", "sipadan", "palau", "mafia", "cayman", "belize", "bonaire", "mozambique", "lembeh", "aliwal"], // 11월
  ["similan", "socorro", "rajaampat", "maldives", "redsea", "palau", "mafia", "cayman", "belize", "bonaire", "mozambique"], // 12월
];
