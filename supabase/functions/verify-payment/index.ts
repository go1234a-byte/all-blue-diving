// ALL BLUE — 토스페이먼츠 결제 승인 검증.
//
// 클라이언트(PaymentSuccess.tsx)는 결제창에서 돌아온 paymentKey/orderId/amount를
// 이 함수로 보내고, 이 함수가 토스 결제 승인(confirm) API를 서버에서 호출해 실제
// 승인·금액 일치를 확인한 뒤 결과를 돌려준다. 클라이언트는 이 결과를 신뢰하고
// 예약(Booking)을 생성한다.
//
// 필요한 시크릿:
//   - TOSS_SECRET_KEY: 토스 개발자센터의 시크릿 키. 프론트엔드의 클라이언트 키와
//     같은 상점(MID)에서 나온 짝이어야 한다. 미설정 시 { skeleton: true }를 돌려
//     클라이언트가 "결제 시스템 설정 미완료" 안내를 띄운다.
//
// 배포: verify_jwt = false (세션 유무와 무관하게 호출됨).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface ConfirmBody {
  paymentKey?: string;
  orderId?: string;
  amount?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { paymentKey, orderId, amount }: ConfirmBody = await req.json();
    if (!paymentKey || !orderId || !amount) {
      return json({ verified: false, error: "paymentKey, orderId, amount는 필수입니다." }, 400);
    }

    const secretKey = Deno.env.get("TOSS_SECRET_KEY");
    if (!secretKey) {
      console.warn("[verify-payment] TOSS_SECRET_KEY 미설정");
      return json({ verified: false, skeleton: true, message: "TOSS_SECRET_KEY가 서버에 설정되지 않았습니다." });
    }

    const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${secretKey}:`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    const data = await res.json();

    if (!res.ok) {
      console.error("[verify-payment] 토스 승인 실패:", data);
      return json({
        verified: false,
        error: data?.code,
        message: data?.message ?? "결제 승인에 실패했습니다.",
      });
    }

    if (Number(data.totalAmount) !== Number(amount)) {
      console.error("[verify-payment] 금액 불일치:", data.totalAmount, "vs", amount);
      return json({ verified: false, message: "결제 금액이 주문 금액과 일치하지 않습니다." });
    }

    return json({
      verified: true,
      method: data.method,
      easyPayProvider: data.easyPay?.provider,
    });
  } catch (err) {
    console.error("[verify-payment] 처리 중 에러:", err);
    return json({ verified: false, error: err instanceof Error ? err.message : "unknown error" }, 500);
  }
});
