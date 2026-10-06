import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import type { NotificationSettingKey, NotificationSettings } from "@/lib/alertsApi";
import { MAX_TOUR_ALERT_SUBSCRIPTIONS } from "@/types/alerts";

interface AlertSettingsViewProps {
  /** undefined = 아직 불러오는 중 */
  settings: NotificationSettings | undefined;
  busy?: boolean;
  onChange: (key: NotificationSettingKey, enabled: boolean) => void;
  subscriptionCount: number;
  onManageSubscriptions: () => void;
  /** 같은 카드 하단의 "기기 푸시 알림" 행 (데이터 연결된 토글은 컨테이너가 넘긴다) */
  devicePushRow: ReactNode;
}

/**
 * 마이페이지 투어 알림 카드 (화면 전용). 종류별 스위치 3개 + 구분선 + 기기 푸시 행.
 * 종류별 설정은 DB에 저장되고, 준비물 리마인드는 4-2 발송 기능이 붙기 전까지 저장만 된다.
 */
export function AlertSettingsView({
  settings,
  busy = false,
  onChange,
  subscriptionCount,
  onManageSubscriptions,
  devicePushRow,
}: AlertSettingsViewProps) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="space-y-1">
        <h2 className="text-[18px] font-bold text-foreground">투어 알림</h2>
        <p className="text-[13px] text-muted-foreground">알림 종류별로 켜고 끌 수 있어요.</p>
      </div>

      {settings === undefined ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      ) : (
        <div className="divide-y divide-border">
          <SettingRow
            id="alert-favorite"
            title="찜한 투어 모집 마감"
            description="찜한 투어가 마감 7일·1일 전에 알려드려요."
            checked={settings.favorite_alerts_enabled}
            disabled={busy}
            onChange={(v) => onChange("favorite_alerts_enabled", v)}
          />
          <SettingRow
            id="alert-subscription"
            title="새 투어 구독"
            description={`조건에 맞는 새 투어가 열리면 알려드려요. (${subscriptionCount}/${MAX_TOUR_ALERT_SUBSCRIPTIONS})`}
            checked={settings.subscription_alerts_enabled}
            disabled={busy}
            onChange={(v) => onChange("subscription_alerts_enabled", v)}
            action={
              <button
                type="button"
                onClick={onManageSubscriptions}
                className="flex min-h-11 items-center gap-0.5 text-[13px] font-semibold text-primary dark:text-primary-glow"
              >
                구독 조건 관리
                <ChevronRight className="h-4 w-4" />
              </button>
            }
          />
          <SettingRow
            id="alert-checklist"
            title="준비물 리마인드"
            description="출발 7일·1일 전 준비물을 알려드려요. 준비물 기능이 열리면 발송돼요."
            checked={settings.checklist_reminders_enabled}
            disabled={busy}
            onChange={(v) => onChange("checklist_reminders_enabled", v)}
          />
        </div>
      )}

      <div className="border-t border-border pt-4">{devicePushRow}</div>
    </section>
  );
}

/** 한 행 = 52px 이상. 제목·설명 + 스위치. action이 있으면 설명 아래에 붙인다. */
function SettingRow({
  id,
  title,
  description,
  checked,
  disabled,
  onChange,
  action,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[52px] items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1 space-y-0.5">
        <Label htmlFor={id} className="text-[16px] font-semibold text-foreground">
          {title}
        </Label>
        <p className="break-keep text-[13px] text-muted-foreground">{description}</p>
        {action}
      </div>
      <Switch
        id={id}
        className="relative before:absolute before:-inset-2.5 before:content-['']"
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
