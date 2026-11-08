/**
 * "처음이라면 읽어 보세요" — 다이빙 기초·안전 글. 홈 가로줄과 /guide 페이지가 같이 쓴다.
 * 출처가 있는 글은 출처를, 없는 일반 안내는 "올블루 편집"으로 표기한다.
 * 보험 글은 국내 약관 확인 전이라 보류(.planning/content-review/2026-11-08_검토요청.md).
 */
export interface DiveBasic {
  id: string;
  title: string;
  summary: string;
  body: string[];
  image: string;
  sources: { label: string; url: string }[];
  checkedAt: string;
}

const CHECKED = "2026-11-08";

export const DIVE_BASICS: DiveBasic[] = [
  {
    id: "certification",
    title: "오픈워터와 어드밴스드, 무엇이 다른가요",
    summary: "자격증마다 내려갈 수 있는 수심과 참여할 수 있는 투어가 달라요.",
    body: [
      "PADI 기준 오픈워터(OW)는 최대 18m까지 다이빙하도록 교육받습니다. 교육 중 내려간 깊이가 그보다 얕았다면 그 깊이까지입니다.",
      "어드밴스드(AOW)를 마치면 30m까지 넓어집니다. 30m보다 깊은 다이빙은 딥 다이버 같은 별도 과정이 필요합니다.",
      "투어마다 요구하는 자격이 다르니 투어 상세의 \"필요 자격\"을 먼저 확인하세요. SSI 등 다른 교육 단체도 단계 구성이 비슷합니다.",
    ],
    image: "/landing/scuba1.webp",
    sources: [
      { label: "PADI 블로그 — 오픈워터와 어드밴스드의 수심", url: "https://blog.padi.com/how-deep-can-open-water-vs-advanced-divers-go/" },
      { label: "Wikipedia — Advanced Open Water Diver", url: "https://en.wikipedia.org/wiki/Advanced_Open_Water_Diver" },
    ],
    checkedAt: CHECKED,
  },
  {
    id: "flying",
    title: "다이빙 후 비행기는 언제 타나요",
    summary: "한 번 잠수했다면 최소 12시간, 여러 번·여러 날이면 최소 18시간 쉬기를 권해요.",
    body: [
      "DAN 권고(2002년 워크숍 합의)는 감압이 필요 없는 다이빙을 한 번 했다면 비행 전 최소 12시간, 하루 여러 번 또는 여러 날 다이빙했다면 최소 18시간 쉬는 것입니다.",
      "감압 다이빙을 했다면 18시간보다 충분히 더 쉬기를 권합니다. PADI는 가능하면 24시간을 권합니다.",
      "이 시간은 \"최소\"이고, 위험이 0이 되는 시간은 아닙니다. 귀국편 시간을 보고 마지막 다이빙 날짜를 정하세요.",
    ],
    image: "/landing/hero.webp",
    sources: [
      { label: "DAN — Guidelines for Flying After Diving", url: "https://dan.org/health-medicine/health-resource/health-safety-guidelines/guidelines-for-flying-after-diving/" },
      { label: "DAN 비행 워크숍 요약(PDF)", url: "https://dan.org/wp-content/uploads/2020/07/fad_proceedingsummary_final.pdf" },
    ],
    checkedAt: CHECKED,
  },
  {
    id: "freedive-buddy",
    title: "프리다이빙은 절대 혼자 하지 않기",
    summary: "한 명이 내려가면 한 명은 수면에서 지켜보는 것이 기본이에요.",
    body: [
      "프리다이빙의 첫째 원칙은 혼자 하지 않는 것입니다. AIDA 각국 지부와 교육 단체가 모두 이 원칙을 맨 앞에 둡니다.",
      "버디는 한 명이 내려가면 한 명은 수면에서 지켜보는 방식(원 업 원 다운)으로 번갈아 다이빙합니다. 버디는 구조 방법을 교육받은 사람이어야 합니다.",
      "얕은 바다나 수영장에서도 같은 원칙이 적용됩니다.",
    ],
    image: "/landing/descend.webp",
    sources: [
      { label: "AIDA Belgium — never dive alone", url: "https://old.aidabelgium.be/en/page/3/" },
      { label: "SSI — 프리다이빙의 위험과 대처", url: "https://www.divessi.com/en/blog/risks-of-freediving-9948.html" },
    ],
    checkedAt: CHECKED,
  },
  {
    id: "packing",
    title: "첫 해외 투어 준비물",
    summary: "자격증 카드, 로그북, 마스크와 래시가드, 그리고 개인 약.",
    body: [
      "자격증 카드(또는 교육 단체 앱), 로그북, 마스크·스노클, 래시가드를 챙기세요.",
      "멀미약을 포함한 개인 약, 다이빙 보험 가입 내역, 수중 사진을 찍는다면 방수 케이스도 필요합니다.",
      "장비 대여 여부와 사이즈는 투어 상세의 \"포함 사항\"에서 확인하세요.",
    ],
    image: "/landing/coral.webp",
    sources: [],
    checkedAt: CHECKED,
  },
  {
    id: "liveaboard-first",
    title: "리브어보드가 처음이라면",
    summary: "배에서 먹고 자며 하루 여러 번 다이빙해요. 참가 조건부터 확인하세요.",
    body: [
      "리브어보드는 배에서 먹고 자며 하루 여러 번 다이빙합니다. 횟수는 투어마다 다릅니다.",
      "멀미가 걱정되면 출발 전에 약을 준비하고, 참가 조건(최소 로그 수·자격)을 먼저 확인하세요.",
      "선상 일정은 날씨와 바다 상황에 따라 바뀔 수 있습니다.",
    ],
    image: "/landing/whale.webp",
    sources: [],
    checkedAt: CHECKED,
  },
];

export const DIVE_BASICS_NOTICE = "일반 안내이며 의료·안전 판단을 대신하지 않습니다. 개인 상황은 강사·의사와 상의하세요.";
