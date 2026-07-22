import { supabase } from "@/integrations/supabase/client";

/**
 * ALL BLUE — 실제 OS 웹푸시(Web Push) 클라이언트 진입점.
 *
 * TODO: 실푸시 연동 필요 — VAPID 키 발급 후 아래를 완성하세요.
 * 1. 로컬에서 `npx web-push generate-vapid-keys`로 VAPID 공개/개인 키 쌍을 생성한다.
 * 2. 공개 키를 프론트엔드 빌드 환경변수 `VITE_VAPID_PUBLIC_KEY`로 등록한다(Netlify 환경변수).
 * 3. 개인 키는 `supabase_add_secret` 도구로 Supabase Edge Function 시크릿
 *    "VAPID_PRIVATE_KEY"(그리고 공개 키도 "VAPID_PUBLIC_KEY")로 등록한다.
 * 4. `supabase/migrations/migration_20260719_070000000`를 Supabase SQL Editor에서 실행해
 *    push_subscriptions 테이블을 생성한다.
 * 5. `supabase/functions/send-push` Edge Function을 Supabase CLI로 배포한다
 *    (`supabase functions deploy send-push`).
 *
 * 위 설정이 없으면 구독 요청은 콘솔 경고만 남기고 조용히 스킵된다(스켈레톤 모드).
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

export function isPushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC_KEY);
}

/** 현재 브라우저가 이 기기에서 이미 푸시 구독 중인지 확인한다. */
export async function getPushSubscriptionStatus(): Promise<"granted" | "denied" | "default" | "unsupported"> {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

/** 알림 권한을 요청하고, 허용되면 구독을 생성해 Supabase에 저장한다. */
export async function subscribeToPush(profileId: string): Promise<{ success: boolean; reason?: string }> {
  if (!isPushSupported()) {
    return { success: false, reason: "이 브라우저는 푸시 알림을 지원하지 않습니다." };
  }
  if (!VAPID_PUBLIC_KEY) {
    console.warn(
      "[push] VITE_VAPID_PUBLIC_KEY가 설정되지 않아 실제 푸시 구독을 건너뜁니다. (TODO: 실푸시 연동 필요)",
    );
    return { success: false, reason: "TODO: 실푸시 연동 필요 — VAPID 키가 아직 설정되지 않았습니다." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { success: false, reason: "알림 권한이 허용되지 않았습니다." };
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { success: false, reason: "구독 정보를 생성하지 못했습니다." };
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      profile_id: profileId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    console.error("[push] 구독 정보 저장 실패:", error.message);
    return { success: false, reason: "구독 정보를 저장하지 못했습니다." };
  }

  return { success: true };
}

/** 이 기기의 푸시 구독을 해제하고 Supabase에서도 삭제한다. */
export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

/**
 * 특정 유저(profileId)에게 즉시 푸시를 보낸다.
 * VAPID/Edge Function이 아직 설정되지 않았다면 서버에서 스켈레톤 응답(전송 안 함)을 반환한다.
 */
export async function sendPushToProfile(
  profileId: string,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  const { error } = await supabase.functions.invoke("send-push", {
    body: { profileId, ...payload },
  });
  if (error) {
    // 실푸시 미설정 상태에서도 앱 동작에는 영향이 없도록 콘솔 경고만 남긴다.
    console.warn("[push] send-push 호출 실패(설정 전이라면 정상):", error.message);
  }
}
