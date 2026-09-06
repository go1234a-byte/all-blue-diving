import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

// iOS/Android 네이티브(Capacitor) 앱에서 소셜 로그인을 "인앱"으로 처리한다.
// App Store Guideline 4: 로그인이 외부 사파리로 튕기면 안 됨 → Apple이 제시한 대로
// SFSafariViewController(@capacitor/browser의 Browser.open)로 띄우고,
// 커스텀 URL scheme 딥링크(com.allblue.diving://…)로 돌아온 콜백을 앱에서 마무리한다.

export const NATIVE_OAUTH_SCHEME = "com.allblue.diving";
export const NATIVE_OAUTH_REDIRECT = `${NATIVE_OAUTH_SCHEME}://auth-callback`;
// 네이버 로그인 Callback URL은 http(s)만 허용(커스텀 스킴 불가). 그래서 네이티브 앱도
// redirect_uri는 웹 콜백 페이지를 쓰고, 그 페이지(NaverCallback.tsx)가 state의 "native:" 접두사를
// 보고 com.allblue.diving://naver-callback 로 다시 바운스해 앱으로 넘겨준다.
export const WEB_ORIGIN = "https://allbluedive.com";
export const NATIVE_NAVER_WEB_REDIRECT = `${WEB_ORIGIN}/naver-callback`;
export const NATIVE_NAVER_SCHEME_REDIRECT = `${NATIVE_OAUTH_SCHEME}://naver-callback`;
export const NATIVE_STATE_PREFIX = "native:";
const NAVER_STATE_KEY = "allblue-naver-oauth-state";
const NAVER_CLIENT_ID =
  (import.meta.env.VITE_NAVER_CLIENT_ID as string | undefined) || "PSqaIFHOT1EyLk93VclD";

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/** Apple/Kakao/Google (Supabase 기본 provider) — 인앱 브라우저로 OAuth 시작. */
export async function startNativeOAuth(provider: "apple" | "kakao" | "google"): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: NATIVE_OAUTH_REDIRECT, skipBrowserRedirect: true },
  });
  if (error || !data?.url) throw error ?? new Error("로그인 URL을 만들지 못했습니다.");
  await Browser.open({ url: data.url, presentationStyle: "popover" });
}

/** 네이버 — 커스텀 브릿지. 인앱 브라우저로 네이버 인가 화면을 띄운다. */
export async function startNativeNaverOAuth(): Promise<void> {
  const state = NATIVE_STATE_PREFIX + crypto.randomUUID();
  window.sessionStorage.setItem(NAVER_STATE_KEY, state);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: NAVER_CLIENT_ID,
    redirect_uri: NATIVE_NAVER_WEB_REDIRECT,
    state,
  });
  await Browser.open({
    url: `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`,
    presentationStyle: "popover",
  });
}

/**
 * 딥링크 콜백 처리. App.tsx의 appUrlOpen 리스너에서 호출.
 * 처리한 URL이면 true를 돌려준다(그 외 딥링크는 무시).
 */
export async function handleOAuthDeepLink(url: string): Promise<boolean> {
  if (!url.startsWith(`${NATIVE_OAUTH_SCHEME}://`)) return false;

  // 인앱 브라우저를 먼저 닫는다.
  try {
    await Browser.close();
  } catch {
    /* 이미 닫혔으면 무시 */
  }

  const parsed = new URL(url);

  // ── Apple/Kakao/Google: PKCE code 교환 ──
  if (parsed.host === "auth-callback") {
    const code = parsed.searchParams.get("code");
    const errDesc = parsed.searchParams.get("error_description") || parsed.searchParams.get("error");
    if (errDesc) throw new Error(errDesc);
    if (!code) throw new Error("인증 코드를 받지 못했습니다.");
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return true;
  }

  // ── 네이버: state 검증 → edge function → verifyOtp ──
  if (parsed.host === "naver-callback") {
    const code = parsed.searchParams.get("code");
    const state = parsed.searchParams.get("state");
    const naverErr = parsed.searchParams.get("error_description") || parsed.searchParams.get("error");
    const storedState = window.sessionStorage.getItem(NAVER_STATE_KEY);
    window.sessionStorage.removeItem(NAVER_STATE_KEY);
    if (naverErr) throw new Error(naverErr);
    if (!code || !state || !storedState || state !== storedState) {
      throw new Error("네이버 로그인 요청이 유효하지 않습니다. 다시 시도해주세요.");
    }
    const { data, error: fnError } = await supabase.functions.invoke("naver-oauth-exchange", {
      body: { code, state, redirectUri: NATIVE_NAVER_WEB_REDIRECT },
    });
    if (fnError || !data?.tokenHash) {
      throw new Error(data?.error || fnError?.message || "네이버 로그인 처리에 실패했습니다.");
    }
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: data.tokenHash,
      type: "magiclink",
    });
    if (verifyError) throw verifyError;
    return true;
  }

  return true;
}
