import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import {
  getPushSubscriptionStatus,
  isPushConfigured,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";

/**
 * 마이페이지 공용 — 브라우저 푸시 알림 수신 동의 토글.
 * VAPID 키가 아직 설정되지 않은 환경(TODO: 실푸시 연동 필요)에서는
 * 안내 문구만 보여주고 스위치는 비활성화된다.
 */
export function PushNotificationToggle() {
  const { profile, isLoggedIn } = useRole();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPushSubscriptionStatus().then((status) => setEnabled(status === "granted"));
  }, []);

  if (!isLoggedIn || !profile) return null;
  if (!isPushSupported()) return null;

  const configured = isPushConfigured();

  const handleToggle = async (next: boolean) => {
    setLoading(true);
    try {
      if (next) {
        const result = await subscribeToPush(profile.id);
        if (result.success) {
          setEnabled(true);
          toast({ title: "푸시 알림이 활성화되었습니다" });
        } else {
          toast({ title: "푸시 알림을 켤 수 없습니다", description: result.reason, variant: "destructive" });
        }
      } else {
        await unsubscribeFromPush();
        setEnabled(false);
        toast({ title: "푸시 알림이 꺼졌습니다" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
      <div className="flex items-start gap-2.5">
        <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="space-y-0.5">
          <Label className="text-sm font-medium text-foreground">푸시 알림 받기</Label>
          <p className="break-keep text-xs text-muted-foreground">
            {configured
              ? "예약, 정산, 투어 출발 알림을 이 기기의 OS 알림으로 받습니다."
              : "현재 서비스 준비 중인 기능입니다. 곧 지원될 예정입니다."}
          </p>
        </div>
      </div>
      <Switch checked={enabled} onCheckedChange={handleToggle} disabled={!configured || loading} />
    </div>
  );
}
