// ALL BLUE — 토스페이먼츠 결제 승인 + 예약 생성.
//
// 클라이언트(PaymentSuccess.tsx)는 결제창에서 돌아온 paymentKey/orderId를 보낸다(금액은 보내지 않는다).
// 이 함수는 (1) 로그인한 사용자의 주문(payment_orders)을 찾고, (2) 주문에 저장된 서버 계산 금액으로 토스 승인을
// 호출하고, (3) 서비스 롤로 finalize_paid_order 를 호출해 예약을 만든다. 예약 생성이 실패하면 결제를 자동 취소한다.
// 예약은 이 경로로만 만들어진다(DB가 클라이언트의 직접 insert를 막는다).
//
// 필요한 시크릿: TOSS_SECRET_KEY(결제 클라이언트 키와 같은 상점의 시크릿 키). 미설정이면 { skeleton: true }.
// 배포: verify_jwt = false (함수 안에서 직접 토큰을 확인한다).
import { createClient } from "jsr:@supabase/supabase-js@2";
import { confirmOrder, type Deps, type Order } from "./logic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { paymentKey, orderId } = await req.json();
    if (typeof paymentKey !== "string" || typeof orderId !== "string" || !paymentKey || !orderId) {
      return json({ verified: false, error: "BAD_REQUEST", message: "paymentKey, orderId는 필수입니다." }, 400);
    }
    const secretKey = Deno.env.get("TOSS_SECRET_KEY");
    if (!secretKey) {
      console.warn("[verify-payment] TOSS_SECRET_KEY 미설정");
      return json({ verified: false, skeleton: true, message: "TOSS_SECRET_KEY가 서버에 설정되지 않았습니다." });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) return json({ verified: false, error: "UNAUTHORIZED", message: "로그인이 필요합니다." }, 401);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const deps: Deps = {
      fetch: (u, init) => fetch(u, init),
      secretKey,
      getOrder: async (id) => {
        const { data } = await admin.from("payment_orders").select("order_id,diver_id,amount,status,booking_id").eq("order_id", id).maybeSingle();
        return (data as Order | null) ?? null;
      },
      finalize: async (id, key, method) => {
        const { data, error } = await admin.rpc("finalize_paid_order", { p_order_id: id, p_payment_key: key, p_method: method });
        return error ? { error: error.message } : { bookingId: data as string };
      },
      mark: async (id, status, reason) => {
        await admin.rpc("mark_payment_order", { p_order_id: id, p_status: status, p_reason: reason });
      },
    };
    const result = await confirmOrder(deps, { paymentKey, orderId, userId: userData.user.id });
    if (!result.verified) console.error("[verify-payment]", orderId, result);
    else if (!result.alreadyPaid) {
      // 정산(payout/invoice)은 예약자 본인 권한으로만 만들 수 있는 RPC라 사용자 토큰으로 호출한다(멱등).
      // 실패해도 예약·결제는 유효하다 — 화면(registerPaidBooking)과 관리자 "정산 재시도"가 다시 처리한다.
      const { error: settleError } = await userClient.rpc("create_booking_settlement", { p_booking_id: result.bookingId });
      if (settleError) console.error("[verify-payment] 정산 생성 실패:", result.bookingId, settleError.message);
    }
    return json(result);
  } catch (err) {
    console.error("[verify-payment] 처리 중 에러:", err);
    return json({ verified: false, error: "SERVER_ERROR", message: err instanceof Error ? err.message : "unknown error" }, 500);
  }
});
