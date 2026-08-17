// ALL BLUE — 특정 프로필(강사/다이버)에게 실제 OS 푸시를 보낸다.
//
// 두 경로를 각각 독립적으로 시도한다 — 한쪽 시크릿이 없어도 다른 쪽은 정상 동작해야 하므로
// 하나가 실패/미설정이어도 나머지 한쪽은 계속 진행한다.
//
// 1) 네이티브(안드로이드 Capacitor 앱, FCM): fcm_tokens에 등록된 기기가 있으면 Firebase
//    Cloud Messaging HTTP v1 API로 발송한다.
//   - FCM_PROJECT_ID: Firebase 콘솔 > 프로젝트 설정 > 일반 탭의 "프로젝트 ID"
//   - FCM_SERVICE_ACCOUNT_JSON: Firebase 콘솔 > 프로젝트 설정 > 서비스 계정 >
//     "새 비공개 키 생성"으로 받은 JSON 파일의 전체 내용(문자열 그대로)
//
// 2) 모바일 웹(Web Push): push_subscriptions에 구독이 있으면 web-push(RFC8291 암호화 포함)로
//    발송한다.
//   - VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY: `npx web-push generate-vapid-keys`로 생성한 키 쌍.
//     공개 키는 프론트엔드 VITE_VAPID_PUBLIC_KEY와 반드시 동일해야 한다.
//   - VAPID_SUBJECT: `mailto:someone@example.com` 형식 (푸시 서비스가 발송자 문의처로 사용).
//
// 둘 다 시크릿이 없으면 조용히 스킵하고 200을 반환한다 — 클라이언트(src/lib/push.ts의
// sendPushToProfile)는 이 경우를 정상 상태로 취급해 콘솔 경고만 남기고 넘어가도록 이미
// 작성되어 있다.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

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

async function sendFcmNotifications(
  supabaseAdmin: ReturnType<typeof createClient>,
  profileId: string,
  payload: { title: string; body: string; url?: string },
): Promise<{ attempted: boolean; sent: number; total: number }> {
  const projectId = Deno.env.get("FCM_PROJECT_ID");
  const serviceAccountJson = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
  if (!projectId || !serviceAccountJson) {
    console.warn("[send-push] FCM_PROJECT_ID/FCM_SERVICE_ACCOUNT_JSON 미설정 — FCM 발송 스킵 (설정 전이라면 정상)");
    return { attempted: false, sent: 0, total: 0 };
  }

  const { data: tokens, error: tokensError } = await supabaseAdmin
    .from("fcm_tokens")
    .select("token")
    .eq("profile_id", profileId);
  if (tokensError) throw tokensError;
  if (!tokens || tokens.length === 0) return { attempted: true, sent: 0, total: 0 };

  const serviceAccount = JSON.parse(serviceAccountJson);
  const accessToken = await getFcmAccessToken(serviceAccount);

  const staleTokens: string[] = [];
  const results = await Promise.all(
    tokens.map(async ({ token }) => {
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            token,
            notification: { title: payload.title, body: payload.body },
            data: payload.url ? { url: payload.url } : undefined,
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
        return false;
      }
      return true;
    }),
  );

  if (staleTokens.length > 0) {
    await supabaseAdmin.from("fcm_tokens").delete().in("token", staleTokens);
  }
  return { attempted: true, sent: results.filter(Boolean).length, total: results.length };
}

async function sendWebPushNotifications(
  supabaseAdmin: ReturnType<typeof createClient>,
  profileId: string,
  payload: { title: string; body: string; url?: string },
): Promise<{ attempted: boolean; sent: number; total: number }> {
  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const subject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:support@allbluedive.com";
  if (!publicKey || !privateKey) {
    console.warn("[send-push] VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY 미설정 — Web Push 발송 스킵 (설정 전이라면 정상)");
    return { attempted: false, sent: 0, total: 0 };
  }

  const { data: subs, error: subsError } = await supabaseAdmin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("profile_id", profileId);
  if (subsError) throw subsError;
  if (!subs || subs.length === 0) return { attempted: true, sent: 0, total: 0 };

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const staleEndpoints: string[] = [];
  const results = await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: payload.title, body: payload.body, url: payload.url }),
        );
        return true;
      } catch (err) {
        // 410 Gone/404 Not Found = 브라우저에서 구독이 만료/해제된 경우. 정리한다.
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          staleEndpoints.push(sub.endpoint);
        }
        console.error("[send-push] Web Push 발송 실패:", statusCode, err);
        return false;
      }
    }),
  );

  if (staleEndpoints.length > 0) {
    await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
  }
  return { attempted: true, sent: results.filter(Boolean).length, total: results.length };
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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const payload = { title, body, url };
    const [fcm, webPush] = await Promise.all([
      sendFcmNotifications(supabaseAdmin, profileId, payload),
      sendWebPushNotifications(supabaseAdmin, profileId, payload),
    ]);

    return new Response(JSON.stringify({ fcm, webPush }), {
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
