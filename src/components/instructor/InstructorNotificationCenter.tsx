import { AlertOctagon, Bell, BellRing, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { formatKRW } from "@/lib/pricing";
import { formatDateKR } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface InstructorNotificationCenterProps {
  instructorId: string;
}

/**
 * 강사 전용 실시간 알림 센터.
 * 다이버의 결제 트랜잭션이 확정되는 즉시(addBooking) AppDataContext에서 생성되는
 * InstructorNotification 레코드를 구독해 목록으로 노출한다.
 */
export function InstructorNotificationCenter({ instructorId }: InstructorNotificationCenterProps) {
  const navigate = useNavigate();
  const { instructorNotifications, markInstructorNotificationRead } = useAppData();
  const myNotifications = instructorNotifications.filter((n) => n.instructorId === instructorId);
  const unreadCount = myNotifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Bell className="h-4 w-4" />
          알림 센터
        </h3>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-[10px]">
            새 알림 {unreadCount}건
          </Badge>
        )}
      </div>

      {myNotifications.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">아직 알림이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {myNotifications.map((notification) => {
            const isPenalty = notification.type === "forced_refund_penalty";
            const isMinCancelled = notification.type === "min_participants_cancelled";
            const isMinProceed = notification.type === "min_participants_proceed";
            const isMinDecisionNeeded = notification.type === "min_participants_decision_needed";
            const isWarning = isPenalty || isMinCancelled || isMinProceed || isMinDecisionNeeded;
            const label = isPenalty
              ? "[강제 환불 승인 조치]"
              : isMinCancelled
                ? "[최소 인원 미달 - 예약 자동취소]"
                : isMinProceed
                  ? "[최소 인원 미달 - 투어 진행 안내]"
                  : isMinDecisionNeeded
                    ? "[최소 인원 미달 - 결정 필요]"
                    : "[신규 투어 예약 완료]";
            const description = isPenalty
              ? "관리자가 이의신청 건에 대해 강제 환불을 승인했습니다."
              : isMinCancelled
                ? "출발 30일 전 기준 최소 인원 미달로 해당 예약이 자동 취소되고 전액 환불 처리되었습니다."
                : isMinProceed
                  ? '출발 30일 전 기준 최소 인원 미달이지만 강사가 "그대로 진행"을 선택해 투어는 진행됩니다.'
                  : isMinDecisionNeeded
                    ? "출발 30일 전 기준 최소 인원 미달로 모집이 마감되었습니다. 아래 대시보드에서 진행/취소를 결정해주세요."
                    : "어떤 유저가 어떤 옵션을 선택해 결제했습니다.";
            return (
              <Card
                key={notification.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/tour/${notification.tourId}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") navigate(`/tour/${notification.tourId}`);
                }}
                className={cn(
                  "cursor-pointer border-primary/30 transition-shadow hover:shadow-ocean",
                  isWarning && "border-2 border-destructive bg-destructive/10",
                  !isWarning && !notification.read && "border-2 border-primary/60 bg-secondary/40",
                )}
              >
                <CardContent className="space-y-1.5 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "flex items-center gap-1.5 break-keep text-sm font-semibold",
                        isWarning ? "text-destructive" : "text-foreground",
                      )}
                    >
                      {isWarning ? (
                        <AlertOctagon className="h-4 w-4 shrink-0" />
                      ) : (
                        <BellRing className="h-4 w-4 shrink-0" />
                      )}
                      {label}
                    </p>
                    {!notification.read && (
                      <Badge
                        className={cn(
                          "shrink-0 text-[9px]",
                          isWarning ? "bg-destructive text-destructive-foreground" : "bg-accent text-accent-foreground",
                        )}
                      >
                        NEW
                      </Badge>
                    )}
                  </div>
                  <p className="break-keep text-xs text-muted-foreground">{description}</p>
                  <div className="space-y-0.5 text-xs text-foreground">
                    {notification.diverName && (
                      <p className="break-keep">- 예약자명: {notification.diverName} 다이버</p>
                    )}
                    <p className="break-keep">- 투어: {notification.tourTitle}</p>
                    {notification.selectedOptionNames && (
                      <p className="break-keep">
                        - 선택한 추가 옵션 내역:{" "}
                        {notification.selectedOptionNames.length > 0
                          ? notification.selectedOptionNames.join(", ")
                          : "없음"}
                      </p>
                    )}
                    {isPenalty && (
                      <p className="break-keep font-semibold text-destructive">
                        - 정산 조치 내역: 해당 투어에 매핑된 정산 예정 금액이 강사 정산 원장에서 전액 차감 /
                        지급 보류(Hold Payout) 처리되었습니다. (원금 {formatKRW(notification.settlementAmount ?? 0)})
                      </p>
                    )}
                    {isMinCancelled && (
                      <p className="break-keep font-semibold text-destructive">
                        - 해당 예약은 전액(100%) 환불 처리되었습니다.
                      </p>
                    )}
                    {isMinProceed && (
                      <p className="break-keep font-semibold text-destructive">
                        - 등록 시 서약하신 대로, 최소 인원 미달 상태로 투어를 진행하여 발생하는 모든 책임은
                        강사 본인에게 있습니다.
                      </p>
                    )}
                    {isMinDecisionNeeded && (
                      <p className="break-keep font-semibold text-destructive">
                        - 강사 대시보드 상단의 "결정 필요" 패널에서 진행 또는 취소(전액환불)를 선택해주세요.
                      </p>
                    )}
                    {notification.type === "new_booking" && (
                      <p className="break-keep font-semibold text-primary">
                        - 정산 예정 금액: {formatKRW(notification.settlementAmount ?? 0)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-muted-foreground">{formatDateKR(notification.createdAt)}</span>
                    <div className="flex items-center gap-1.5">
                      {isPenalty && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-6 gap-1 text-[10px]"
                          onClick={(e) => e.stopPropagation()}
                          asChild
                        >
                          <Link to="/instructor/arbitration">이의 제기</Link>
                        </Button>
                      )}
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 gap-1 text-[10px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            markInstructorNotificationRead(notification.id);
                          }}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          확인 완료
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
