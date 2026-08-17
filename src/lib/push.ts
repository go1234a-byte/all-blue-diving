import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";

/**
 * ALL BLUE — OS 푸시 클라이언트 진입점. 안드로이드 네이티브(Capacitor) 앱에서는 FCM을,
 * 모바일 웹에서는 Web Push를 사용한다 — 이 파일의 공개 함수들은 두 경로를 내부에서
 * 분기하므로 호출부(PushNotificationToggle 등)는 플랫폼을 신경 쓸 필요가 없다.
 *
 * 네이티브(FCM) 경로 — TODO: google-services.json 반영 후 VITE_FCM_CONFIGURED=true로
 * 바꾸고 재빌드할 것. google-services.json이 없는 상태에서 PushNotifications.register()를
 * 호출하면 안드로이드 네이티브 레이어(FirebaseApp 미초기화)에서 즉시 앱이 죽는 것을
 * 에뮬레이터로 직접 확인했다(JS try/catch로 못 잡는 네이티브 크래시 —
 * "FATAL EXCEPTION: CapacitorPlugins / IllegalStateException: Default FirebaseApp is
 * not initialized"). Web Push가 VAPID_PUBLIC_KEY 유무로 스스로를 게이팅하는 것과 똑같은
 * 패턴으로, 이 플래그가 꺼져 있으면 네이티브 앱에서도 토글이 비활성화된 채 "서비스 준비
 * 중" 문구만 보여주고 register()를 아예 호출하지 않는다.
 * 1. Firebase 콘솔에서 안드로이드 앱(com.allblue.diving) 등록 후 google-services.json을
 *    android/app/에 넣는다.
 * 2. 프론트엔드 빌드 환경변수 `VITE_FCM_CONFIGURED=true`를 등록한다.
 * 3. 서버 발송을 위해 supabase/functions/send-push가 필요로 하는 FCM 서비스 계정
 *    시크릿(FCM_PROJECT_ID/FCM_SERVICE_ACCOUNT_JSON)도 함께 등록한다.
 *
 * Web Push 경로(TODO: 실푸시 연동 필요 — VAPID 키 발급 후 완성):
 * 1. 로컬에서 `npx web-push generate-vapid-keys`로 VAPID 공개/개인 키 쌍을 생성한다.
 * 2. 공개 키를 프론트엔드 빌드 환경변수 `VITE_VAPID_PUBLIC_KEY`로 등록한다(Netlify 환경변수).
 * 3. 개인 키는 `supabase_add_secret` 도구로 Supabase Edge Function 시크릿
 *    "VAPID_PRIVATE_KEY"(그리고 공개 키도 "VAPID_PUBLIC_KEY")로 등록한다.
 * 4. `supabase/functions/send-push` Edge Function을 Supabase CLI로 배포한다
 *    (`supabase functions deploy send-push`).
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
const NATIVE_PUSH_CONFIGURED = import.meta.env.VITE_FCM_CONFIGURED === "true";
const NATIVE_TOKEN_STORAGE_KEY = "allblue-fcm-token";

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

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
  if (isNative()) return true;
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

export function isPushConfigured(): boolean {
  if (isNative()) return NATIVE_PUSH_CONFIGURED;
  return Boolean(VAPID_PUBLIC_KEY);
}

/** 현재 기기에서 이미 푸시를 허용했는지 확인한다 (네이티브: FCM 권한, 웹: 브라우저 알림 권한). */
export async function getPushSubscriptionStatus(): Promise<"granted" | "denied" | "default" | "unsupported"> {
  if (isNative()) {
    const result = await PushNotifications.checkPermissions();
    if (result.receive === "granted") return "granted";
    if (result.receive === "denied") return "denied";
    return "default";
  }
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

/** 안드로이드 네이티브 앱: FCM 권한 요청 → 토큰 발급 → fcm_tokens에 저장. */
async function subscribeToNativePush(profileId: string): Promise<{ success: boolean; reason?: string }> {
  if (!NATIVE_PUSH_CONFIGURED) {
    // google-services.json 없이 PushNotifications.register()를 호출하면 안드로이드
    // 네이티브 레이어(FirebaseApp 미초기화)에서 JS로 못 잡는 크래시가 난다 — 반드시
    // 여기서 막는다. isPushConfigured()가 이미 false를 반환해 토글 자체가 비활성화되어
    // 있어야 정상이므로, 이 분기는 방어적 이중 체크다.
    return { success: false, reason: "TODO: FCM 연동 필요 — Firebase 프로젝트가 아직 설정되지 않았습니다." };
  }
  let permission = await PushNotifications.checkPermissions();
  if (permission.receive === "prompt" || permission.receive === "prompt-with-rationale") {
    permission = await PushNotifications.requestPermissions();
  }
  if (permission.receive !== "granted") {
    return { success: false, reason: "알림 권한이 허용되지 않았습니다." };
  }

  return new Promise((resolve) => {
    const successListener = PushNotifications.addListener("registration", async (token) => {
      void successListener.then((l) => l.remove());
      void errorListener.then((l) => l.remove());
      const { error } = await supabase
        .from("fcm_tokens")
        .upsert({ profile_id: profileId, token: token.value, platform: "android" }, { onConflict: "token" });
      if (error) {
        console.error("[push] FCM 토큰 저장 실패:", error.message);
        resolve({ success: false, reason: "토큰 저장에 실패했습니다." });
        return;
      }
      window.localStorage.setItem(NATIVE_TOKEN_STORAGE_KEY, token.value);
      resolve({ success: true });
    });
    const errorListener = PushNotifications.addListener("registrationError", (err) => {
      void successListener.then((l) => l.remove());
      void errorListener.then((l) => l.remove());
      console.error("[push] FCM 등록 실패(google-services.json 미설정이라면 정상):", err);
      resolve({ success: false, reason: "이 기기에 알림을 등록하지 못했습니다." });
    });
    void PushNotifications.register();
  });
}

/** 알림 권한을 요청하고, 허용되면 구독을 생성해 Supabase에 저장한다. */
export async function subscribeToPush(profileId: string): Promise<{ success: boolean; reason?: string }> {
  if (isNative()) return subscribeToNativePush(profileId);
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
  if (isNative()) {
    const token = window.localStorage.getItem(NATIVE_TOKEN_STORAGE_KEY);
    if (!token) return;
    await supabase.from("fcm_tokens").delete().eq("token", token);
    window.localStorage.removeItem(NATIVE_TOKEN_STORAGE_KEY);
    return;
  }
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
