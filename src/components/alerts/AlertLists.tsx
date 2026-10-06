import { Bell, ChevronRight, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ACTIVITY_LABEL } from "@/lib/activityBadge";
import { formatDateTimeKR } from "@/lib/dates";
import type { DiverNotification, DiverNotificationKind, TourAlertSubscription } from "@/types/alerts";

const KIND_LABEL: Record<DiverNotificationKind, string> = {
  deadline_d7: "모집 마감 D-7",
  deadline_d1: "모집 마감 D-1",
  new_tour: "새 투어",
  booking_changed: "예약 변경",
  price_drop: "가격 인하",
  seats_low: "마감 임박",
  seat_opened: "자리 남",
};

function describeSubscription(sub: TourAlertSubscription): string {
  const months = sub.months.length === 0 ? "모든 달" : sub.months.map((m) => `${m}월`).join(", ");
  const activities =
    sub.activityTypes.length === 0 ? "모든 활동" : sub.activityTypes.map((a) => ACTIVITY_LABEL[a]).join(", ");
  return `${months} · ${activities}`;
}

/** 받은 알림 목록 — 한 줄에 종류·시각·제목·본문. 누르면 url로 이동. */
export function DiverNotificationList({
  items,
  onOpen,
}: {
  items: DiverNotification[];
  onOpen: (item: DiverNotification) => void;
}) {
  return (
    <ul className="space-y-3">
      {items.map((n) => (
        <li key={n.id}>
          <button
            type="button"
            onClick={() => onOpen(n)}
            className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-secondary/60"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[13px] text-muted-foreground">
                {KIND_LABEL[n.kind]} · {formatDateTimeKR(n.createdAt)}
              </p>
              <p className="truncate text-[15px] font-semibold text-foreground">{n.title}</p>
              <p className="line-clamp-2 text-[13px] text-muted-foreground">{n.body}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** 구독 조건 목록 — 켜고 끄기(스위치)와 삭제(44px 터치 영역). */
export function SubscriptionList({
  items,
  onToggle,
  onRemove,
  busy,
}: {
  items: TourAlertSubscription[];
  onToggle: (item: TourAlertSubscription, enabled: boolean) => void;
  onRemove: (item: TourAlertSubscription) => void;
  busy?: boolean;
}) {
  return (
    <ul className="space-y-3">
      {items.map((sub) => (
        <li key={sub.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-foreground">{sub.country}</p>
            <p className="truncate text-[13px] text-muted-foreground">{describeSubscription(sub)}</p>
          </div>
          <Switch
            className="relative before:absolute before:-inset-2.5 before:content-['']"
            checked={sub.enabled}
            onCheckedChange={(v) => onToggle(sub, v)}
            aria-label={`${sub.country} 구독 켜기`}
            disabled={busy}
          />
          <button
            type="button"
            onClick={() => onRemove(sub)}
            disabled={busy}
            aria-label={`${sub.country} 구독 삭제`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** 빈 상태 = 선 아이콘 + 한 줄 + 버튼 하나 (디자인 가이드). */
export function AlertEmptyState({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
      <Bell className="h-8 w-8 text-muted-foreground" />
      <p className="text-[15px] text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={onAction}
        className="inline-flex h-11 items-center rounded-xl border border-border bg-card px-5 text-[15px] font-semibold text-foreground transition-colors hover:bg-secondary/60"
      >
        {actionLabel}
      </button>
    </div>
  );
}
