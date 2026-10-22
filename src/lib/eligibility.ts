/**
 * "내 자격으로 이 투어 갈 수 있나?" 판정. 투어 상세의 자격 확인 카드가 쓴다.
 * 최종 판단은 강사가 하므로 여기 결과는 안내용이다.
 */

const SCUBA_RANK = ["ow", "aow", "rescue", "master", "inst"];
const FREEDIVING_RANK = ["basic", "level1", "level2", "level3", "inst"];

export type LastDive = "recent" | "over6m";

export interface EligibilityInput {
  isFreediving: boolean;
  /** 투어 요구 자격 키. DB에 "AOW"·"무관"·빈 값도 섞여 있다. */
  requiredCert: string | undefined;
  minLogCount: number | undefined;
  myCert: string;
  myLogs: number;
  lastDive: LastDive;
}

export type EligibilityResult =
  | { status: "ok" }
  | { status: "refresher" }
  | { status: "lack-cert" }
  | { status: "lack-logs"; missing: number };

export function checkEligibility(i: EligibilityInput): EligibilityResult {
  const rank = i.isFreediving ? FREEDIVING_RANK : SCUBA_RANK;
  const required = String(i.requiredCert ?? "").trim().toLowerCase();
  const requiredRank = !required || required === "무관" ? -1 : rank.indexOf(required);
  if (rank.indexOf(i.myCert) < requiredRank) return { status: "lack-cert" };
  const missing = (i.minLogCount ?? 0) - i.myLogs;
  if (missing > 0) return { status: "lack-logs", missing };
  // 6개월 넘게 쉬면 대부분의 다이빙 센터가 리프레셔(재교육 다이빙)를 요구한다(스쿠버 기준).
  if (!i.isFreediving && i.lastDive === "over6m") return { status: "refresher" };
  return { status: "ok" };
}
