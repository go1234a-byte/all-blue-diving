import { useNavigate } from "react-router-dom";
import { AlertSettingsView } from "@/components/alerts/AlertSettingsView";
import { PushNotificationToggle } from "@/components/mypage/PushNotificationToggle";
import { useToast } from "@/hooks/use-toast";
import { useNotificationSettings, useTourAlertMutations, useTourAlertSubscriptions } from "@/hooks/useTourAlerts";
import type { NotificationSettingKey } from "@/lib/alertsApi";

/** 마이페이지 — 투어 알림 설정 (데이터 연결). 화면은 AlertSettingsView에 있다. */
export function TourAlertSettingsCard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const settings = useNotificationSettings();
  const subscriptions = useTourAlertSubscriptions();
  const { updateSetting } = useTourAlertMutations();

  const handleChange = async (key: NotificationSettingKey, enabled: boolean) => {
    try {
      await updateSetting.mutateAsync({ key, enabled });
      toast({ title: enabled ? "알림을 켰어요" : "알림을 껐어요" });
    } catch (error) {
      toast({
        title: "설정을 저장하지 못했어요",
        description: error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertSettingsView
      settings={settings.data}
      busy={updateSetting.isPending}
      onChange={handleChange}
      subscriptionCount={subscriptions.data?.length ?? 0}
      onManageSubscriptions={() => navigate("/notifications")}
      devicePushRow={<PushNotificationToggle variant="row" />}
    />
  );
}
