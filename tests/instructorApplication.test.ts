import { test } from "node:test";
import assert from "node:assert/strict";
import { instructorApplicationStatus } from "../src/lib/instructorApplication.ts";

test("강사 전환 신청 상태", () => {
  assert.equal(instructorApplicationStatus(undefined), "none");
  assert.equal(instructorApplicationStatus({ verified: false }), "pending");
  assert.equal(instructorApplicationStatus({ verified: false, rejectedAt: "2026-11-06" }), "rejected");
  // 승인되면 예전 반려 이력이 남아 있어도 승인이 우선이다.
  assert.equal(instructorApplicationStatus({ verified: true, rejectedAt: "2026-11-06" }), "approved");
});
