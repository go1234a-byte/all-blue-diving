// ALL BLUE — 회원 탈퇴 (계정 완전 삭제).
//
// 마이페이지 > 회원 탈퇴 > 탈퇴하기에서 사용자의 access token과 함께 호출된다.
// 호출자 본인의 auth 계정을 Admin API로 하드 삭제하고, 탈퇴 후 6개월 재가입 제한
// (is_recently_deleted_account RPC가 참조)을 위해 deleted_accounts에 이메일/전화번호를
// 남긴다. profiles 등 연관 데이터는 auth.users FK ON DELETE CASCADE로 함께 정리된다.
//
// 배포: verify_jwt = false (함수 내부에서 전달된 토큰을 직접 검증한다).

import { createClient } from "npm:@supabase/supabase-js@2";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return json({ success: false, error: "인증 토큰이 없습니다." }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return json({ success: false, error: "세션이 유효하지 않습니다." }, 401);
    }
    const user = userData.user;

    // 재가입 제한용 스냅샷 (실패해도 탈퇴는 진행)
    let phone: string | null = null;
    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("phone")
        .eq("id", user.id)
        .maybeSingle();
      phone = profile?.phone ?? null;
    } catch (_) { /* ignore */ }

    try {
      await admin.from("deleted_accounts").insert({
        original_user_id: user.id,
        email: user.email ?? null,
        phone,
      });
    } catch (e) {
      console.warn("[delete-account] deleted_accounts 기록 실패(무시하고 진행):", e);
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) {
      console.error("[delete-account] 계정 삭제 실패:", delErr);
      return json({ success: false, error: delErr.message }, 500);
    }

    return json({ success: true });
  } catch (err) {
    console.error("[delete-account] 처리 중 에러:", err);
    return json({ success: false, error: err instanceof Error ? err.message : "unknown error" }, 500);
  }
});
