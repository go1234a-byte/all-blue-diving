import { test } from "node:test";
import assert from "node:assert/strict";
import { refundRateForDays, refundSummary } from "../src/lib/refund.ts";
import { dDayLabel, ratingText, seatState, seatsLeft } from "../src/lib/tourDisplay.ts";

test("환불율은 정책 표(30일 100 / 15일 50 / 7일 30 / 미만 0)와 경계값까지 같다", () => {
  assert.equal(refundRateForDays(45), 1);
  assert.equal(refundRateForDays(30), 1);
  assert.equal(refundRateForDays(29), 0.5);
  assert.equal(refundRateForDays(15), 0.5);
  assert.equal(refundRateForDays(14), 0.3);
  assert.equal(refundRateForDays(7), 0.3);
  assert.equal(refundRateForDays(6), 0);
  assert.equal(refundRateForDays(-3), 0);
});

test("환불 요약 문구", () => {
  assert.deepEqual(refundSummary(40), { title: "전액 환불", sub: "출발 30일 전까지 (D-10)" });
  assert.deepEqual(refundSummary(30), { title: "전액 환불", sub: "출발 30일 전까지" });
  assert.equal(refundSummary(20).title, "50% 환불");
  assert.equal(refundSummary(10).title, "30% 환불");
  assert.equal(refundSummary(2).title, "환불 불가");
});

test("남은 자리와 상태", () => {
  assert.equal(seatsLeft({ maxParticipants: 12 }, 4), 8);
  assert.equal(seatsLeft({ maxParticipants: 12 }, 15), 0);
  assert.equal(seatState({ maxParticipants: 12 }, 12), "full");
  assert.equal(seatState({ maxParticipants: 12 }, 9), "few");
  assert.equal(seatState({ maxParticipants: 12 }, 8), "ok");
});

test("별점은 후기가 있을 때만, D-day 라벨", () => {
  assert.equal(ratingText([]), null);
  assert.deepEqual(ratingText([5, 4, 4]), { avg: "4.3", count: 3 });
  assert.equal(dDayLabel(26), "D-26");
  assert.equal(dDayLabel(0), "D-DAY");
  assert.equal(dDayLabel(-1), null);
});
