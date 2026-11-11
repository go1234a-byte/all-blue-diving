import { test } from "node:test";
import assert from "node:assert/strict";
import { confirmOrder, mapMethod, type Deps, type Order } from "../supabase/functions/verify-payment/logic.ts";

const order = (over: Partial<Order> = {}): Order => ({ order_id: "o1", diver_id: "u1", amount: 1000000, status: "pending", booking_id: null, ...over });
const res = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

function mk(o: Order | null, toss: (url: string, init?: RequestInit) => Response, fin: { bookingId?: string; error?: string }) {
  const calls: string[] = [];
  const marks: string[] = [];
  const deps: Deps = {
    secretKey: "sk",
    fetch: async (u, init) => { calls.push(`${init?.method ?? "GET"} ${u.replace("https://api.tosspayments.com/v1/payments", "")}${init?.body ? " " + init.body : ""}`); return toss(u, init); },
    getOrder: async () => o,
    finalize: async () => fin,
    mark: async (_id, s, r) => { marks.push(`${s}:${r}`); },
  };
  return { deps, calls, marks };
}
const done = { orderId: "o1", totalAmount: 1000000, status: "DONE", easyPay: { provider: "카카오페이" } };

test("성공: 주문 금액으로 승인 → 예약 생성", async () => {
  const { deps, calls } = mk(order(), () => res(200, done), { bookingId: "b1" });
  const r = await confirmOrder(deps, { paymentKey: "pk", orderId: "o1", userId: "u1" });
  assert.deepEqual(r, { verified: true, bookingId: "b1", method: "kakaopay", easyPayProvider: "카카오페이" });
  assert.ok(calls[0].includes('"amount":1000000'), "승인 금액은 저장된 주문 금액");
});

test("남의 주문·없는 주문은 같은 답, 토스는 호출하지 않는다", async () => {
  for (const o of [order({ diver_id: "other" }), null]) {
    const { deps, calls } = mk(o, () => res(200, done), { bookingId: "b1" });
    const r = await confirmOrder(deps, { paymentKey: "pk", orderId: "o1", userId: "u1" });
    assert.equal(r.verified, false);
    assert.equal(calls.length, 0);
  }
});

test("결제창에서 더 적은 금액을 냈다면 토스가 거절 → 예약 없음, 주문 failed", async () => {
  const { deps, marks } = mk(order(), () => res(400, { code: "INVALID_REQUEST", message: "결제 금액이 일치하지 않습니다." }), { bookingId: "b1" });
  const r = await confirmOrder(deps, { paymentKey: "pk", orderId: "o1", userId: "u1" });
  assert.equal(r.verified, false);
  assert.match(marks[0], /^failed:/);
});

test("이미 결제 완료된 주문은 같은 예약을 돌려준다(멱등)", async () => {
  const { deps, calls } = mk(order({ status: "paid", booking_id: "b9" }), () => res(200, done), { bookingId: "b1" });
  const r = await confirmOrder(deps, { paymentKey: "pk", orderId: "o1", userId: "u1" });
  assert.equal(r.verified && r.bookingId, "b9");
  assert.equal(calls.length, 0);
});

test("예약 생성 실패 → 결제 자동 취소 + 주문 refunded", async () => {
  const { deps, calls, marks } = mk(order(), (u) => (u.endsWith("/cancel") ? res(200, {}) : res(200, done)), { error: "정원이 초과되어 예약할 수 없습니다" });
  const r = await confirmOrder(deps, { paymentKey: "pk", orderId: "o1", userId: "u1" });
  assert.equal(r.verified, false);
  assert.ok(calls.some((c) => c.startsWith("POST /pk/cancel")));
  assert.match(marks[0], /^refunded:/);
  assert.equal(!r.verified && r.refunded, true);
});

test("취소까지 실패하면 REFUND_NEEDED로 남긴다", async () => {
  const { deps, marks } = mk(order(), (u) => (u.endsWith("/cancel") ? res(500, {}) : res(200, done)), { error: "x" });
  const r = await confirmOrder(deps, { paymentKey: "pk", orderId: "o1", userId: "u1" });
  assert.equal(!r.verified && r.error, "REFUND_NEEDED");
  assert.match(marks[0], /^failed:REFUND_NEEDED/);
});

test("이전에 승인만 되고 끊긴 결제(ALREADY_PROCESSED)는 조회 후 이어서 예약 생성", async () => {
  const { deps, calls } = mk(order(), (u) => (u.endsWith("/confirm") ? res(400, { code: "ALREADY_PROCESSED_PAYMENT" }) : res(200, done)), { bookingId: "b2" });
  const r = await confirmOrder(deps, { paymentKey: "pk", orderId: "o1", userId: "u1" });
  assert.equal(r.verified && r.bookingId, "b2");
  assert.ok(calls.some((c) => c.startsWith("GET /pk")));
});

test("토스 응답의 금액·주문이 다르면 예약 없이 취소", async () => {
  const { deps, marks } = mk(order(), (u) => (u.endsWith("/cancel") ? res(200, {}) : res(200, { ...done, totalAmount: 1000 })), { bookingId: "b1" });
  const r = await confirmOrder(deps, { paymentKey: "pk", orderId: "o1", userId: "u1" });
  assert.equal(r.verified, false);
  assert.match(marks[0], /^refunded:MISMATCH/);
});

test("결제수단 매핑", () => {
  assert.equal(mapMethod("토스페이"), "tosspay");
  assert.equal(mapMethod("네이버페이"), "naverpay");
  assert.equal(mapMethod(undefined), "card");
});
