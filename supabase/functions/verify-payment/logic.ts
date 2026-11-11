// 결제 승인 → 예약 생성의 핵심 로직. Deno API를 쓰지 않는 순수 TS라 node:test로 검증한다(tests/verifyPayment.test.ts).
// 원칙: 금액은 클라이언트가 보낸 값이 아니라 서버가 저장한 주문(payment_orders.amount)만 쓴다.

export interface Order {
  order_id: string;
  diver_id: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "refunded";
  booking_id: string | null;
}

export interface Deps {
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
  secretKey: string;
  getOrder: (orderId: string) => Promise<Order | null>;
  finalize: (orderId: string, paymentKey: string, method: string) => Promise<{ bookingId?: string; error?: string }>;
  mark: (orderId: string, status: "failed" | "refunded", reason: string) => Promise<void>;
}

export type Result =
  | { verified: true; bookingId: string; method: string; easyPayProvider?: string; alreadyPaid?: boolean }
  | { verified: false; error?: string; message: string; refunded?: boolean };

const TOSS = "https://api.tosspayments.com/v1/payments";

export function mapMethod(easyPayProvider?: string): string {
  if (easyPayProvider) {
    if (easyPayProvider.includes("토스")) return "tosspay";
    if (easyPayProvider.includes("카카오")) return "kakaopay";
    if (easyPayProvider.includes("네이버")) return "naverpay";
    if (easyPayProvider.toLowerCase().includes("apple")) return "applepay";
  }
  return "card";
}

function auth(secretKey: string): Record<string, string> {
  return { Authorization: `Basic ${btoa(`${secretKey}:`)}`, "Content-Type": "application/json" };
}

export async function confirmOrder(
  deps: Deps,
  input: { paymentKey: string; orderId: string; userId: string },
): Promise<Result> {
  const { paymentKey, orderId, userId } = input;
  const order = await deps.getOrder(orderId);
  // 남의 주문은 "없는 주문"과 똑같이 답한다.
  if (!order || order.diver_id !== userId) return { verified: false, error: "ORDER_NOT_FOUND", message: "주문을 찾을 수 없습니다." };
  if (order.status === "paid" && order.booking_id) {
    return { verified: true, bookingId: order.booking_id, method: "card", alreadyPaid: true };
  }
  if (order.status !== "pending") {
    return { verified: false, error: "ORDER_NOT_PAYABLE", message: "이미 처리된 주문입니다. 내 예약에서 확인해 주세요." };
  }

  // 토스 승인 — 금액은 저장된 주문 금액. 결제창에서 다른 금액이 결제됐다면 토스가 여기서 거절한다.
  let payment: Record<string, any> | null = null;
  const res = await deps.fetch(`${TOSS}/confirm`, {
    method: "POST",
    headers: auth(deps.secretKey),
    body: JSON.stringify({ paymentKey, orderId, amount: order.amount }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok) {
    payment = body;
  } else if (body?.code === "ALREADY_PROCESSED_PAYMENT") {
    // 이전 시도에서 승인은 됐는데 예약 생성 전에 끊긴 경우 — 결제 상태를 직접 조회해 이어서 처리한다.
    const lookup = await deps.fetch(`${TOSS}/${encodeURIComponent(paymentKey)}`, { headers: auth(deps.secretKey) });
    const found = await lookup.json().catch(() => ({}));
    if (lookup.ok && found?.status === "DONE") payment = found;
  }
  if (!payment) {
    await deps.mark(orderId, "failed", `${body?.code ?? "CONFIRM_FAILED"}: ${body?.message ?? ""}`);
    return { verified: false, error: body?.code, message: body?.message ?? "결제 승인에 실패했습니다." };
  }

  // 방어: 토스 응답이 이 주문·금액과 같은지 한 번 더 확인한다.
  if (payment.orderId !== orderId || Number(payment.totalAmount) !== Number(order.amount) || payment.status !== "DONE") {
    await cancel(deps, paymentKey, "주문 정보 불일치");
    await deps.mark(orderId, "refunded", "MISMATCH");
    return { verified: false, error: "MISMATCH", message: "결제 정보가 주문과 일치하지 않아 결제를 취소했습니다.", refunded: true };
  }

  const method = mapMethod(payment.easyPay?.provider);
  const done = await deps.finalize(orderId, paymentKey, method);
  if (done.bookingId) {
    return { verified: true, bookingId: done.bookingId, method, easyPayProvider: payment.easyPay?.provider };
  }

  // 결제는 됐는데 예약을 못 만들었다(정원 마감·쿠폰 소진 등) → 자동 결제 취소.
  const cancelled = await cancel(deps, paymentKey, "예약 생성 실패로 자동 취소");
  await deps.mark(orderId, cancelled ? "refunded" : "failed", cancelled ? (done.error ?? "FINALIZE_FAILED") : `REFUND_NEEDED: ${done.error ?? ""}`);
  return cancelled
    ? { verified: false, error: "BOOKING_FAILED", message: `${done.error ?? "예약을 만들지 못했어요."} 결제는 자동으로 취소됩니다.`, refunded: true }
    : { verified: false, error: "REFUND_NEEDED", message: "결제는 완료됐지만 예약을 만들지 못했어요. 고객센터로 바로 문의해 주세요." };
}

async function cancel(deps: Deps, paymentKey: string, reason: string): Promise<boolean> {
  try {
    const r = await deps.fetch(`${TOSS}/${encodeURIComponent(paymentKey)}/cancel`, {
      method: "POST",
      headers: auth(deps.secretKey),
      body: JSON.stringify({ cancelReason: reason }),
    });
    return r.ok;
  } catch {
    return false;
  }
}
