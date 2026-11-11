import { test } from "node:test";
import assert from "node:assert/strict";
import { processRefunds, type Deps, type RefundRequest } from "../supabase/functions/process-refunds/logic.ts";

const req = (over: Partial<RefundRequest> = {}): RefundRequest => ({ id: "r1", booking_id: "b1", payment_key: "pk1", amount: 500000, reason: "고객 취소", ...over });
const res = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

function mk(requests: RefundRequest[], toss: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const done: string[] = [];
  const deps: Deps = {
    secretKey: "sk",
    fetch: async (url, init) => { calls.push({ url, init }); return toss(url, init); },
    claim: async () => requests,
    finish: async (id, ok, error, tx) => { done.push(`${id}:${ok ? "ok" : "fail"}:${error ?? ""}:${tx ?? ""}`); },
  };
  return { deps, calls, done };
}

test("성공: 저장된 금액·사유로 취소하고 거래 키를 기록, 멱등 키는 요청 id", async () => {
  const { deps, calls, done } = mk([req()], () => res(200, { cancels: [{ transactionKey: "tx1" }, { transactionKey: "tx2" }] }));
  const s = await processRefunds(deps);
  assert.deepEqual(s, { done: 1, failed: 0 });
  assert.ok(calls[0].url.endsWith("/pk1/cancel"));
  const body = JSON.parse(String(calls[0].init?.body));
  assert.equal(body.cancelAmount, 500000);
  assert.equal(body.cancelReason, "고객 취소");
  assert.equal((calls[0].init?.headers as Record<string, string>)["Idempotency-Key"], "r1");
  assert.deepEqual(done, ["r1:ok::tx2"]);
});

test("이미 취소된 결제는 완료로 본다", async () => {
  const { deps, done } = mk([req()], () => res(400, { code: "ALREADY_CANCELED_PAYMENT", message: "이미 취소된 결제" }));
  const s = await processRefunds(deps);
  assert.deepEqual(s, { done: 1, failed: 0 });
  assert.match(done[0], /^r1:ok/);
});

test("토스 오류는 실패로 기록(재시도 대상)하고 다른 요청은 계속 처리", async () => {
  const { deps, done } = mk([req({ id: "r1", payment_key: "bad" }), req({ id: "r2", payment_key: "good" })], (url) =>
    url.includes("/bad/") ? res(400, { code: "NOT_CANCELABLE_AMOUNT", message: "취소 가능 금액 초과" }) : res(200, { cancels: [] }),
  );
  const s = await processRefunds(deps);
  assert.deepEqual(s, { done: 1, failed: 1 });
  assert.match(done[0], /^r1:fail:NOT_CANCELABLE_AMOUNT/);
  assert.match(done[1], /^r2:ok/);
});

test("네트워크 예외도 실패로 기록", async () => {
  const { deps, done } = mk([req()], () => { throw new Error("timeout"); });
  const s = await processRefunds(deps);
  assert.deepEqual(s, { done: 0, failed: 1 });
  assert.match(done[0], /^r1:fail:timeout/);
});

test("처리할 요청이 없으면 아무것도 호출하지 않는다", async () => {
  const { deps, calls } = mk([], () => res(200, {}));
  assert.deepEqual(await processRefunds(deps), { done: 0, failed: 0 });
  assert.equal(calls.length, 0);
});
