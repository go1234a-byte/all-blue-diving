import { AlertOctagon, Bell, BellRing } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { computeTourAlerts } from "@/lib/notifications";
import { cn } from "@/lib/utils";

/**
 * 인앱 알림센터 (실제 OS 푸시 인프라 부재로 대체 구현).
 * - 다이버(public 역할, 로그인 상태): 확정 예약 기준 투어 출발 D-3 / D-1 알림.
 * - 강사(instructor 역할): 신규 예약/유료 옵션 결제 완료 실시간 알림.
 */
export function NotificationBell() {
  const { role, isLoggedIn, currentDiverId, currentInstructorId } = useRole();
  const { tours, bookings, instructorNotifications, markInstructorNotificationRead } = useAppData();

  if (role === "instructor") {
    const myNotifications = instructorNotifications.filter((n) => n.instructorId === currentInstructorId);
    const unreadCount = myNotifications.filter((n) => !n.read).length;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="relative flex h-8 w-8 items-center justify-center rounded-full text-foreground"
            aria-label="알림"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 space-y-2 p-3">
          <p className="text-xs font-semibold text-foreground">강사 알림</p>
          {myNotifications.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">새로운 알림이 없습니다.</p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {myNotifications.map((notification) => {
                const isPenalty = notification.type === "forced_refund_penalty";
                const isMinCancelled = notification.type === "min_participants_cancelled";
                const isMinProceed = notification.type === "min_participants_proceed";
                const isMinDecisionNeeded = notification.type === "min_participants_decision_needed";
                const isWarning = isPenalty || isMinCancelled || isMinProceed || isMinDecisionNeeded;
                const titleText = isPenalty
                  ? "강제 환불 승인 조치"
                  : isMinCancelled
                    ? "최소 인원 미달 - 예약 자동취소"
                    : isMinProceed
                      ? "최소 인원 미달 - 투어 진행 (책임 안내)"
                      : isMinDecisionNeeded
                        ? "최소 인원 미달 - 결정 필요"
                        : "신규 투어 예약 완료";
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "space-y-1 rounded-lg border p-2.5",
                      isWarning
                        ? "border-destructive bg-destructive/10"
                        : !notification.read
                          ? "border-primary/50 bg-secondary/50"
                          : "border-border",
                    )}
                    onClick={() => !notification.read && markInstructorNotificationRead(notification.id)}
                  >
                    <p
                      className={cn(
                        "flex items-center gap-1.5 break-keep text-xs font-semibold",
                        isWarning ? "text-destructive" : "text-foreground",
                      )}
                    >
                      {isWarning ? (
                        <AlertOctagon className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <BellRing className="h-3.5 w-3.5 shrink-0" />
                      )}
                      {titleText}
                    </p>
                    <p className="break-keep text-[11px] text-muted-foreground">
                      - 투어: {notification.tourTitle}
                    </p>
                    {notification.diverName && (
                      <p className="break-keep text-[11px] text-muted-foreground">
                        - 예약자명: {notification.diverName} 다이버
                      </p>
                    )}
                    {notification.selectedOptionNames && notification.selectedOptionNames.length >= 0 && !isMinProceed && notification.diverName && (
                      <p className="break-keep text-[11px] text-muted-foreground">
                        - 선택 옵션: {notification.selectedOptionNames.join(", ") || "없음"}
                      </p>
                    )}
                    {isMinCancelled && (
                      <p className="break-keep text-[11px] text-muted-foreground">
                        - 해당 예약은 전액(100%) 환불 처리되었습니다.
                      </p>
                    )}
                    {isMinProceed && (
                      <p className="break-keep text-[11px] font-medium text-destructive">
                        - 모집이 최소 인원 미달로 마감되었으나 강사님이 &quot;그대로 진행&quot;을 선택해 투어는
                        진행됩니다. 등록 시 서약하신 대로 책임은 강사 본인에게 있습니다.
                      </p>
                    )}
                    {isMinDecisionNeeded && (
                      <p className="break-keep text-[11px] font-medium text-destructive">
                        - 모집이 최소 인원 미달로 마감되었습니다. 강사 콘솔에서 투어를 그대로 진행할지
                        취소(전액환불)할지 선택해주세요.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  }

  if (role !== "public" || !isLoggedIn) return null;

  const alerts = computeTourAlerts(tours, bookings, currentDiverId);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-foreground"
          aria-label="알림"
        >
          <Bell className="h-5 w-5" />
          {alerts.length > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              {alerts.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-2 p-3">
        <p className="text-xs font-semibold text-foreground">알림</p>
        {alerts.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">새로운 알림이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "space-y-1 rounded-lg border p-2.5",
                  alert.level === "d3" || alert.level === "cancelled"
                    ? "border-destructive/40 bg-destructive/5"
                    : "border-primary/30 bg-secondary/50",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="line-clamp-1 text-xs font-semibold text-foreground">{alert.title}</p>
                  <Badge
                    variant={alert.level === "d3" || alert.level === "cancelled" ? "destructive" : "secondary"}
                    className="shrink-0 text-[9px]"
                  >
                    {alert.level === "d3" ? "D-3" : alert.level === "d1" ? "D-1" : "취소/환불"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
