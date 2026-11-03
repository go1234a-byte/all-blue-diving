import { test } from "node:test";
import assert from "node:assert/strict";
import { computeInvoice, estimateTotal } from "../src/lib/pricing.ts";
import { refundRateForDays, refundSummary } from "../src/lib/refund.ts";
import { dDayLabel, earliestStartLabel, minPriceByCountry, ratingText, refundLine, seatState, seatsLeft, shortPrice } from "../src/lib/tourDisplay.ts";

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

test("짧은 가격·나라별 최저가·환불 한 줄·가장 이른 출발일", () => {
  assert.equal(shortPrice(3_278_000), "₩328만");
  assert.equal(shortPrice(9_500), "₩9,500");
  const fee = (p: number) => p * 2;
  assert.deepEqual(minPriceByCountry([{ country: "일본", basePrice: 500 }, { country: "일본", basePrice: 300 }, { country: "필리핀", basePrice: 100 }, { country: "", basePrice: 1 }], fee), { 일본: 600, 필리핀: 200 });
  assert.equal(refundLine(45), "전액 환불 가능");
  assert.equal(refundLine(30), "출발 30일 전까지 전액 환불");
  assert.equal(refundLine(20), "지금 취소 시 50% 환불");
  assert.equal(refundLine(10), "지금 취소 시 30% 환불");
  assert.equal(refundLine(3), "환불 불가 (출발 7일 미만)");
  assert.equal(earliestStartLabel([{ startDate: "2026-12-06" }, { startDate: "2026-11-29T00:00:00Z" }]), "11/29");
  assert.equal(earliestStartLabel([]), null);
});

test("예상 총액은 결제 화면 계산(computeInvoice)과 같고 인원수를 곱한다", () => {
  assert.equal(estimateTotal(1_000_000, [], 1), 1_100_000);
  assert.equal(estimateTotal(1_000_000, [80_000], 2), computeInvoice(2_000_000, [{ name: "o", price: 160_000 }]).totalDue);
  assert.equal(estimateTotal(1_000_000, [80_000], 2), 2_376_000);
  assert.equal(estimateTotal(333_333, [], 3), computeInvoice(999_999).totalDue); // 반올림 차이까지 같다
  assert.equal(estimateTotal(1_000_000, [], 0), 1_100_000); // 0 이하는 1명으로
});
