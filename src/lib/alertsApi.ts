import { supabase } from "@/integrations/supabase/client";
import type { ActivityType } from "@/types";
import type {
  DiverNotification,
  DiverNotificationKind,
  TourAlertSubscription,
  TourAlertSubscriptionInput,
} from "@/types/alerts";

/** PostgREST 오류를 Error로 바꿔 던진다 (호출하는 쪽의 토스트 처리는 그대로). */
function check<T>(result: { data: T | null; error: { message: string } | null }): T | null {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function listDiverNotifications(diverId: string): Promise<DiverNotification[]> {
  const rows = check(
    await supabase
      .from("tour_diver_notifications")
      .select("id,tour_id,kind,title,body,url,created_at")
      .eq("diver_id", diverId)
      .order("created_at", { ascending: false })
      .limit(50),
  );
  return (rows ?? []).map((r) => ({
    id: r.id,
    tourId: r.tour_id,
    kind: r.kind as DiverNotificationKind,
    title: r.title,
    body: r.body,
    url: r.url ?? "",
    createdAt: r.created_at,
  }));
}

export async function listTourAlertSubscriptions(profileId: string): Promise<TourAlertSubscription[]> {
  const rows = check(
    await supabase
      .from("tour_alert_subscriptions")
      .select("id,country,months,activity_types,enabled,created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: true }),
  );
  return (rows ?? []).map((r) => ({
    id: r.id,
    country: r.country,
    months: r.months,
    activityTypes: r.activity_types as ActivityType[],
    enabled: r.enabled,
    createdAt: r.created_at,
  }));
}

/** DB 트리거가 11번째 구독을 P0001로 거절하므로 UI는 사전에 개수로 막고, 실패 메시지는 그대로 올린다. */
export async function createTourAlertSubscription(
  profileId: string,
  input: TourAlertSubscriptionInput,
): Promise<void> {
  check(
    await supabase.from("tour_alert_subscriptions").insert({
      profile_id: profileId,
      country: input.country,
      months: input.months,
      activity_types: input.activityTypes,
      enabled: true,
    }),
  );
}

export async function setTourAlertSubscriptionEnabled(id: string, enabled: boolean): Promise<void> {
  check(await supabase.from("tour_alert_subscriptions").update({ enabled }).eq("id", id));
}

export async function deleteTourAlertSubscription(id: string): Promise<void> {
  check(await supabase.from("tour_alert_subscriptions").delete().eq("id", id));
}

/** 알림 종류별 설정. DB 컬럼명과 1:1 (tour_notification_settings). */
export interface NotificationSettings {
  favorite_alerts_enabled: boolean;
  subscription_alerts_enabled: boolean;
  checklist_reminders_enabled: boolean;
}
export type NotificationSettingKey = keyof NotificationSettings;

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  favorite_alerts_enabled: true,
  subscription_alerts_enabled: true,
  checklist_reminders_enabled: true,
};

/** 행이 없으면 아직 아무것도 끄지 않은 것 — 모두 ON. */
export async function getNotificationSettings(diverId: string): Promise<NotificationSettings> {
  const rows = check(
    await supabase
      .from("tour_notification_settings")
      .select("favorite_alerts_enabled,subscription_alerts_enabled,checklist_reminders_enabled")
      .eq("diver_id", diverId),
  );
  return rows?.[0] ?? DEFAULT_NOTIFICATION_SETTINGS;
}

/** 한 종류만 바꾼다. 행이 처음 생길 때 나머지는 DB 기본값(ON)이 채운다. */
export async function setNotificationSetting(
  diverId: string,
  key: NotificationSettingKey,
  enabled: boolean,
): Promise<void> {
  const patch: Partial<NotificationSettings> = { [key]: enabled };
  check(
    await supabase.from("tour_notification_settings").upsert(
      { diver_id: diverId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "diver_id" },
    ),
  );
}
