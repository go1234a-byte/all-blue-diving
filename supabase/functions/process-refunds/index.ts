// ALL BLUE — 환불 처리: 쌓인 환불 요청(refund_requests)을 토스 결제 취소 API로 실행한다.
// 로그인한 사용자 누구나 호출할 수 있지만 금액·대상은 전부 DB에 저장된 요청에서만 읽으므로 호출자가 바꿀 수 없다
// (여러 번 불러도 같은 요청은 한 번만 환불된다). 취소 직후 앱이 호출하고, 관리자 "환불 재시도"도 이 함수를 부른다.
// 필요한 시크릿: TOSS_SECRET_KEY. 배포: verify_jwt = false (함수 안에서 토큰을 확인한다).
import { createClient } from "jsr:@supabase/supabase-js@2";
import { processRefunds, type Deps, type RefundRequest } from "./logic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const secretKey = Deno.env.get("TOSS_SECRET_KEY");
    if (!secretKey) return json({ ok: false, skeleton: true, message: "TOSS_SECRET_KEY가 서버에 설정되지 않았습니다." });

    const url = Deno.env.get("SUPABASE_URL")!;
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) return json({ ok: false, message: "로그인이 필요합니다." }, 401);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const deps: Deps = {
      fetch: (u, init) => fetch(u, init),
      secretKey,
      claim: async (limit) => {
        const { data, error } = await admin.rpc("claim_refund_requests", { p_limit: limit });
        if (error) throw new Error(error.message);
        return (data ?? []) as RefundRequest[];
      },
      finish: async (id, ok, error, tx) => {
        await admin.rpc("finish_refund_request", { p_id: id, p_ok: ok, p_error: error, p_tx: tx });
      },
    };
    const summary = await processRefunds(deps);
    if (summary.failed > 0) console.error("[process-refunds] 실패 건 있음:", summary);
    return json({ ok: true, ...summary });
  } catch (err) {
    console.error("[process-refunds] 처리 중 에러:", err);
    return json({ ok: false, message: err instanceof Error ? err.message : "unknown error" }, 500);
  }
});
