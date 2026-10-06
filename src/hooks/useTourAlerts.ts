import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRole } from "@/contexts/RoleContext";
import {
  createTourAlertSubscription,
  deleteTourAlertSubscription,
  getNotificationSettings,
  listDiverNotifications,
  listTourAlertSubscriptions,
  setNotificationSetting,
  setTourAlertSubscriptionEnabled,
  type NotificationSettingKey,
} from "@/lib/alertsApi";
import type { TourAlertSubscriptionInput } from "@/types/alerts";

const SEEN_KEY = "allblue-alerts-seen-at";
/** 첫 찜 이후 투어 상세의 찜 안내 줄을 숨기는 기억 키 (기기별, 저장 실패 시 안내는 계속 보인다) */
export const BOOKMARK_HINT_DONE_KEY = "allblue-bookmark-hint-done";

export function readBookmarkHintDone(): boolean {
  try {
    return window.localStorage.getItem(BOOKMARK_HINT_DONE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markBookmarkHintDone(): void {
  try {
    window.localStorage.setItem(BOOKMARK_HINT_DONE_KEY, "1");
  } catch {
    // 저장이 막힌 환경에서는 안내가 다음 방문 때 다시 보일 뿐이다.
  }
}

/**
 * 알림 데이터는 로그인한 다이버만 조회한다(강사·관리자·게스트 제외).
 * AppDataContext에 넣지 않고 React Query로 따로 가져와서, 알림 조회가 전역 로딩을 건드리지 않게 한다.
 */
function useDiverId(): string | undefined {
  const { role, isLoggedIn, currentDiverId } = useRole();
  return role === "public" && isLoggedIn && currentDiverId ? currentDiverId : undefined;
}

export const tourAlertKeys = {
  notifications: (diverId: string) => ["tour-diver-notifications", diverId] as const,
  subscriptions: (diverId: string) => ["tour-alert-subscriptions", diverId] as const,
  settings: (diverId: string) => ["tour-notification-settings", diverId] as const,
};

export function useDiverNotifications() {
  const diverId = useDiverId();
  return useQuery({
    queryKey: tourAlertKeys.notifications(diverId ?? ""),
    queryFn: () => listDiverNotifications(diverId!),
    enabled: !!diverId,
    refetchOnWindowFocus: true,
  });
}

export function useTourAlertSubscriptions() {
  const diverId = useDiverId();
  return useQuery({
    queryKey: tourAlertKeys.subscriptions(diverId ?? ""),
    queryFn: () => listTourAlertSubscriptions(diverId!),
    enabled: !!diverId,
    refetchOnWindowFocus: true,
  });
}

export function useNotificationSettings() {
  const diverId = useDiverId();
  return useQuery({
    queryKey: tourAlertKeys.settings(diverId ?? ""),
    queryFn: () => getNotificationSettings(diverId!),
    enabled: !!diverId,
  });
}

/** 구독 생성/토글/삭제/푸시 설정 변경 뮤테이션. 성공하면 관련 목록을 다시 불러온다. */
export function useTourAlertMutations() {
  const diverId = useDiverId() ?? "";
  const queryClient = useQueryClient();
  const invalidateSubscriptions = () =>
    queryClient.invalidateQueries({ queryKey: tourAlertKeys.subscriptions(diverId) });

  const createSubscription = useMutation({
    mutationFn: (input: TourAlertSubscriptionInput) => createTourAlertSubscription(diverId, input),
    onSuccess: invalidateSubscriptions,
  });
  const toggleSubscription = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      setTourAlertSubscriptionEnabled(id, enabled),
    onSuccess: invalidateSubscriptions,
  });
  const removeSubscription = useMutation({
    mutationFn: (id: string) => deleteTourAlertSubscription(id),
    onSuccess: invalidateSubscriptions,
  });
  const updateSetting = useMutation({
    mutationFn: ({ key, enabled }: { key: NotificationSettingKey; enabled: boolean }) =>
      setNotificationSetting(diverId, key, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tourAlertKeys.settings(diverId) }),
  });

  return { createSubscription, toggleSubscription, removeSubscription, updateSetting };
}

/** 벨 배지의 "읽음" 기준 시각. 기기(브라우저)마다 따로 두는 가벼운 편의 기능이라 localStorage를 쓴다. */
export function useAlertsSeenAt() {
  const read = (): string => {
    try {
      return window.localStorage.getItem(SEEN_KEY) ?? "";
    } catch {
      return "";
    }
  };
  const [seenAt, setSeenAt] = useState<string>(read);

  useEffect(() => {
    const sync = () => setSeenAt(read());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const markSeen = useCallback(() => {
    const now = new Date().toISOString();
    try {
      window.localStorage.setItem(SEEN_KEY, now);
    } catch {
      // 저장이 막힌 환경(사생활 보호 모드 등)에서는 배지가 다음 방문 때 다시 보일 뿐이다.
    }
    setSeenAt(now);
  }, []);

  return { seenAt, markSeen };
}
