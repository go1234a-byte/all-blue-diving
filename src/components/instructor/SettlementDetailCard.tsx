import { CheckCircle2, Clock, Info, ListOrdered } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatKRW } from "@/lib/pricing";
import { formatDateRangeKR, hoursSince } from "@/lib/dates";
import { handleImageFallback, IMAGE_PLACEHOLDER } from "@/lib/image";
import type { Booking, Payout, Tour } from "@/types";

interface SettlementDetailCardProps {
  tour: Tour;
  booking: Booking;
  payout: Payout;
  onViewHistory?: () => void;
}

const SECOND_SETTLEMENT_HOLD_HOURS = 48;

/**
 * 특정 투어(예약) 하나를 선택해 들어온 정산 상세 화면.
 * 최종 확정 구조: 투어 정보 → 정산 요약(총금액-수수료10%-1차80%-최종20%) → 정산 안내 → 정산 내역 보기
 * (요청에 따라 "상세보기" 버튼과 "기준일" 필드는 넣지 않고 정산 상태만 보여준다)
 */
export function SettlementDetailCard({ tour, booking, payout, onViewHistory }: SettlementDetailCardProps) {
  const principal = booking.basePrice + booking.optionsCost; // 정산 대상 금액 (수수료 제외)
  const isHeld = payout.status === "held" || payout.status === "cancelled";
  const secondReady = !isHeld && hoursSince(tour.endDate) >= SECOND_SETTLEMENT_HOLD_HOURS;
  const firstDone = !isHeld;

  return (
    <div className="space-y-4">
      {/* 투어 정보 */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
        <img
          src={tour.mainImageUrl || IMAGE_PLACEHOLDER}
          alt={tour.title}
          onError={handleImageFallback}
          className="h-14 w-14 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="line-clamp-1 text-sm font-semibold text-foreground">{tour.title}</p>
          <p className="text-xs text-muted-foreground">{formatDateRangeKR(tour.startDate, tour.endDate)}</p>
          <Badge variant={isHeld ? "destructive" : "secondary"} className="text-[10px]">
            정산 상태: {isHeld ? "정산 보류" : secondReady ? "정산 완료" : "정산 진행중"}
          </Badge>
        </div>
      </div>

      {/* 정산 요약 */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">정산 요약</p>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">총 결제금액</span>
            <span className="font-medium text-foreground">{formatKRW(booking.totalPaid)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">수수료 10%</span>
            <span className="text-destructive">- {formatKRW(booking.platformFee)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-dashed border-border pt-1.5 font-semibold">
            <span className="text-foreground">정산 대상 금액</span>
            <span className="text-primary">{formatKRW(principal)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="rounded-lg bg-secondary/50 p-3">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              {firstDone ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              ) : (
                <Clock className="h-3.5 w-3.5" />
              )}
              1차 정산 80%
            </div>
            <p className="mt-1 text-sm font-bold text-foreground">{formatKRW(payout.firstAmount)}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {firstDone ? "정산 완료 · 자동 정산" : "정산 보류"}
            </p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              {secondReady ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              ) : (
                <Clock className="h-3.5 w-3.5" />
              )}
              최종 정산 20%
            </div>
            <p className="mt-1 text-sm font-bold text-foreground">{formatKRW(payout.secondAmount)}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {isHeld ? "정산 보류" : secondReady ? "정산 완료" : "대기중 · 투어 종료 후 48시간"}
            </p>
          </div>
        </div>
      </div>

      {/* 정산 안내 */}
      <div className="flex items-start gap-2 rounded-xl bg-secondary/40 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <p className="break-keep">별도의 정산 신청은 필요하지 않습니다.</p>
      </div>

      {onViewHistory && (
        <Button variant="outline" className="w-full gap-1.5 text-xs" onClick={onViewHistory}>
          <ListOrdered className="h-3.5 w-3.5" />
          정산 내역 보기
        </Button>
      )}
    </div>
  );
}
