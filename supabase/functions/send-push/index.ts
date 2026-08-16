// ALL BLUE — 특정 프로필(강사/다이버)에게 실제 OS 푸시를 보낸다.
//
// 네이티브(안드로이드 Capacitor 앱, FCM) 경로가 우선이며, fcm_tokens에 등록된 기기가
// 있으면 Firebase Cloud Messaging HTTP v1 API로 발송한다. 아래 두 시크릿이 설정되어
// 있지 않으면(Firebase 프로젝트 준비 전) 조용히 스킵하고 200을 반환한다 — 클라이언트
// (src/lib/push.ts의 sendPushToProfile)는 이 경우를 정상 상태로 취급해 콘솔 경고만
// 남기고 넘어가도록 이미 작성되어 있다.
//   - FCM_PROJECT_ID: Firebase 콘솔 > 프로젝트 설정 > 일반 탭의 "프로젝트 ID"
//   - FCM_SERVICE_ACCOUNT_JSON: Firebase 콘솔 > 프로젝트 설정 > 서비스 계정 >
//     "새 비공개 키 생성"으로 받은 JSON 파일의 전체 내용(문자열 그대로)
//
// 모바일 웹(Web Push)은 VAPID 연동이 아직 완료되지 않아(push.ts의 TODO 참고) 이
// 함수에서는 다루지 않는다 — push_subscriptions에 구독이 있어도 이 함수는 FCM
// 토큰만 대상으로 발송한다.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendPushBody {
  profileId: string;
  title: string;
  body: string;
  url?: string;
}

function base64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** 서비스 계정 JWT를 만들어 구글 OAuth2 토큰 엔드포인트에서 access_token을 받아온다. */
async function getFcmAccessToken(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64url(signature)}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(`FCM access token 발급 실패: ${JSON.stringify(tokenJson)}`);
  }
  return tokenJson.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId, title, body, url }: SendPushBody = await req.json();
    if (!profileId || !title || !body) {
      return new Response(JSON.stringify({ error: "profileId, title, body는 필수입니다." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const projectId = Deno.env.get("FCM_PROJECT_ID");
    const serviceAccountJson = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
    if (!projectId || !serviceAccountJson) {
      console.warn("[send-push] FCM_PROJECT_ID/FCM_SERVICE_ACCOUNT_JSON 미설정 — 발송 스킵 (설정 전이라면 정상)");
      return new Response(JSON.stringify({ skipped: true, reason: "FCM not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from("fcm_tokens")
      .select("token")
      .eq("profile_id", profileId);
    if (tokensError) throw tokensError;
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "no fcm tokens for profile" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getFcmAccessToken(serviceAccount);

    const staleTokens: string[] = [];
    const results = await Promise.all(
      tokens.map(async ({ token }) => {
        const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title, body },
              data: url ? { url } : undefined,
              android: { priority: "high" },
            },
          }),
        });
        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          const status = errJson?.error?.status;
          if (status === "UNREGISTERED" || status === "NOT_FOUND" || status === "INVALID_ARGUMENT") {
            staleTokens.push(token);
          }
          console.error("[send-push] FCM 발송 실패:", res.status, errJson);
          return { token, ok: false };
        }
        return { token, ok: true };
      }),
    );

    if (staleTokens.length > 0) {
      await supabaseAdmin.from("fcm_tokens").delete().in("token", staleTokens);
    }

    return new Response(JSON.stringify({ sent: results.filter((r) => r.ok).length, total: results.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-push] 처리 중 에러:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
