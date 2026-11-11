// 환불 요청을 토스 결제 취소로 바꾸는 로직. Deno API 없이 순수 TS라 node:test로 검증한다(tests/processRefunds.test.ts).
export interface RefundRequest {
  id: string;
  booking_id: string;
  payment_key: string;
  amount: number;
  reason: string | null;
}

export interface Deps {
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
  secretKey: string;
  claim: (limit: number) => Promise<RefundRequest[]>;
  finish: (id: string, ok: boolean, error: string | null, transactionKey: string | null) => Promise<void>;
}

export interface Summary { done: number; failed: number }

const TOSS = "https://api.tosspayments.com/v1/payments";

export async function processRefunds(deps: Deps, limit = 10): Promise<Summary> {
  const requests = await deps.claim(limit);
  const summary: Summary = { done: 0, failed: 0 };
  for (const r of requests) {
    try {
      const res = await deps.fetch(`${TOSS}/${encodeURIComponent(r.payment_key)}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${deps.secretKey}:`)}`,
          "Content-Type": "application/json",
          "Idempotency-Key": r.id, // 같은 요청을 다시 보내도 토스에서 두 번 환불되지 않는다
        },
        body: JSON.stringify({ cancelReason: (r.reason ?? "예약 취소").slice(0, 200), cancelAmount: r.amount }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        const cancels = Array.isArray(body?.cancels) ? body.cancels : [];
        await deps.finish(r.id, true, null, cancels.at(-1)?.transactionKey ?? null);
        summary.done++;
      } else if (body?.code === "ALREADY_CANCELED_PAYMENT") {
        // 토스 상점관리자 등에서 이미 취소된 결제 — 돈은 돌아갔으니 완료로 본다.
        await deps.finish(r.id, true, null, null);
        summary.done++;
      } else {
        await deps.finish(r.id, false, `${body?.code ?? res.status}: ${body?.message ?? ""}`, null);
        summary.failed++;
      }
    } catch (err) {
      await deps.finish(r.id, false, err instanceof Error ? err.message : "network error", null);
      summary.failed++;
    }
  }
  return summary;
}
