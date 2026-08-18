// ALL BLUE — 네이버 로그인 커스텀 OAuth 브릿지.
//
// Supabase Auth는 카카오/구글/애플과 달리 네이버를 기본 제공(built-in) provider로 지원하지
// 않는다. 그래서 네이버의 authorization code를 직접 받아 액세스 토큰으로 교환하고,
// 네이버 프로필(이메일)을 조회한 뒤, Supabase Admin API로 매직링크 토큰을 발급해
// 클라이언트가 그 토큰으로 실제 세션을 만들 수 있게 중계한다.
//
// 흐름: 클라이언트가 사용자를 네이버 로그인 화면으로 보냄 → 네이버가
// /naver-callback(클라이언트 라우트)으로 code를 돌려줌 → 클라이언트가 이 함수를 호출 →
// 이 함수가 code를 네이버 액세스 토큰으로 교환 → 네이버 프로필(이메일) 조회 →
// auth.admin.generateLink로 매직링크 토큰 발급 → 클라이언트가 그 token_hash로
// supabase.auth.verifyOtp() 호출해 세션 확립.
//
// 이 함수는 로그인 전에(세션 없이) 호출되므로 verify_jwt=false로 배포한다.
//
// 필요한 시크릿:
//   - NAVER_CLIENT_ID / NAVER_CLIENT_SECRET: 네이버 개발자센터(developers.naver.com)에서
//     발급. 클라이언트 ID는 VITE_NAVER_CLIENT_ID로 프론트엔드에도 동일하게 등록해야 한다
//     (네이버 인가 요청 URL을 만드는 데 필요, 공개되어도 되는 값).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExchangeBody {
  code: string;
  state: string;
  redirectUri: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, state, redirectUri }: ExchangeBody = await req.json();
    if (!code || !redirectUri) {
      return new Response(JSON.stringify({ error: "code, redirectUri는 필수입니다." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientId = Deno.env.get("NAVER_CLIENT_ID");
    const clientSecret = Deno.env.get("NAVER_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      console.warn("[naver-oauth-exchange] NAVER_CLIENT_ID/NAVER_CLIENT_SECRET 미설정");
      return new Response(JSON.stringify({ error: "네이버 로그인이 아직 설정되지 않았습니다." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) authorization code -> 네이버 액세스 토큰
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      ...(state ? { state } : {}),
    });
    const tokenRes = await fetch(`https://nid.naver.com/oauth2.0/token?${tokenParams.toString()}`);
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      console.error("[naver-oauth-exchange] 토큰 교환 실패:", tokenJson);
      return new Response(JSON.stringify({ error: "네이버 인증에 실패했습니다.", detail: tokenJson }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) 네이버 프로필(이메일) 조회
    const profileRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const profileJson = await profileRes.json();
    const naverEmail: string | undefined = profileJson?.response?.email;
    if (!profileRes.ok || profileJson.resultcode !== "00" || !naverEmail) {
      console.error("[naver-oauth-exchange] 프로필 조회 실패:", profileJson);
      return new Response(
        JSON.stringify({ error: "네이버 계정에서 이메일 정보를 가져오지 못했습니다. 네이버 로그인 설정에서 이메일 제공에 동의했는지 확인해주세요." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3) Supabase 매직링크 토큰 발급 (기존 계정이면 그 계정으로, 처음이면 새로 생성됨)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: naverEmail,
    });
    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("[naver-oauth-exchange] 매직링크 발급 실패:", linkError);
      return new Response(JSON.stringify({ error: "로그인 세션 생성에 실패했습니다." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ tokenHash: linkData.properties.hashed_token, email: naverEmail }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[naver-oauth-exchange] 처리 중 에러:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
