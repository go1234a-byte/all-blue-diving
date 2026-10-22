import { test } from "node:test";
import assert from "node:assert/strict";
import { checkEligibility } from "../src/lib/eligibility.ts";

const base = { isFreediving: false, requiredCert: "aow", minLogCount: 0, myCert: "aow", myLogs: 30, lastDive: "recent" as const };

test("자격·로그 충족, 최근 다이빙 → 참가 가능", () => {
  assert.deepEqual(checkEligibility(base), { status: "ok" });
});
test("요구 자격보다 낮으면 자격 부족 (DB의 대문자 AOW도 인식)", () => {
  assert.deepEqual(checkEligibility({ ...base, requiredCert: "AOW", myCert: "ow" }), { status: "lack-cert" });
});
test("자격 무관 투어는 누구나", () => {
  assert.deepEqual(checkEligibility({ ...base, requiredCert: "무관", myCert: "ow" }), { status: "ok" });
});
test("로그 부족이면 부족한 횟수", () => {
  assert.deepEqual(checkEligibility({ ...base, minLogCount: 50 }), { status: "lack-logs", missing: 20 });
});
test("6개월 이상 쉬면 리프레셔 권장 (스쿠버만)", () => {
  assert.deepEqual(checkEligibility({ ...base, lastDive: "over6m" }), { status: "refresher" });
  assert.deepEqual(
    checkEligibility({ ...base, isFreediving: true, requiredCert: "level1", myCert: "level2", lastDive: "over6m" }),
    { status: "ok" },
  );
});
