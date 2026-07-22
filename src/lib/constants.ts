import type { CertificationLevel, ScubaCertLevel, FreedivingCertLevel, ViolationType } from "@/types";

export const COUNTRIES_SITES: Record<string, string[]> = {
  "필리핀": ["모알보알", "세부", "아닐라오"],
  "인도네시아": ["발리", "코모도", "라자암팟"],
  "대한민국": ["제주도", "울릉도"],
  "팔라우": ["코로르"],
  "이집트": ["다합", "허가다"],
  "태국": ["코타오", "푸켓"],
  "몰디브": ["말레 아톨"],
};

export const SCUBA_CERT_LABELS: Record<ScubaCertLevel, string> = {
  ow: "OW",
  aow: "AOW",
  rescue: "Rescue",
  master: "Master",
  inst: "Inst",
};

export const FREEDIVING_CERT_LABELS: Record<FreedivingCertLevel, string> = {
  basic: "Basic",
  level1: "Level 1",
  level2: "Level 2",
  level3: "Level 3",
  inst: "Inst",
};

export const CERTIFICATION_LABELS: Record<CertificationLevel, string> = {
  ...SCUBA_CERT_LABELS,
  ...FREEDIVING_CERT_LABELS,
};

export const VIOLATION_TYPES_ADMIN: ViolationType[] = [
  "노쇼 (No-Show)",
  "안전수칙 위반",
  "허위 정보 게재",
  "부적절한 언행",
  "정산 지연",
  "장비 미점검",
];

export const MONTH_LABELS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

export const ROOM_LEGAL_NOTICE =
  "⚠️ 안내: 본 룸 배정은 사전 매칭 결과이며, 현지 리조트 및 숙소 상황에 따라 현장에서 배정이 변동되거나 바뀔 수 있습니다.";

export const TOUR_INCLUSIONS = [
  "숙박",
  "조식 / 중식 / 석식",
  "보트 이용",
  "인증 강사 가이드",
  "그룹채팅 이용",
  "플랫폼 고객지원",
  "공항 픽업 / 샌딩 (해당 투어에 한함)",
];

export const TOUR_EXCLUSIONS = [
  "왕복 항공권",
  "여행자 보험",
  "개인 장비 렌탈",
  "나이트록스(선택사항)",
  "추가 다이빙 비용",
  "관광 옵션",
  "주류 및 음료",
  "개인 경비",
  "개인 팁",
];

/** 강사 투어 개설 시 기본으로 제공되는 표준 유료 옵션 (지역별 가격 상이, 강사가 직접 설정) */
export const STANDARD_TOUR_OPTION_DEFS = [
  { name: "싱글차지 (Single Room Charge)", defaultPrice: 150000 },
  { name: "나이트록스 (Nitrox)", defaultPrice: 30000 },
  { name: "풀 장비 렌탈 (Full Gear Rental)", defaultPrice: 50000 },
];
