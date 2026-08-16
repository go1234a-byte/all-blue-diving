import { useState } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { formatDateKR } from "@/lib/dates";
import { formatKRW } from "@/lib/pricing";

/**
 * addBooking 안에서 예약(bookings) INSERT는 성공했지만 뒤이은 create_booking_settlement
 * RPC가 실패해 정산(payouts)이 만들어지지 않은 예약을 찾아 보여준다. 예전에는 이 실패가
 * console.error로만 남고 관리자가 알 방법이 없어서, 강사가 정산을 못 받는데도 아무도
 * 모르는 상태로 방치될 수 있었다(실사용 중 5인 단체예약 17,600,000원 건에서 실제 발생 확인).
 * 예약 취소/심사중 건은 애초에 정산 대상이 아니므로 제외한다.
 */
export function SettlementGapsPanel() {
  const { bookings, payouts, getTourById, retryBookingSettlement } = useAppData();
  const { toast } = useToast();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const gaps = bookings.filter(
    (b) => b.status === "confirmed" && !payouts.some((p) => p.bookingId === b.id),
  );

  const handleRetry = async (bookingId: string) => {
    setRetryingId(bookingId);
    try {
      await retryBookingSettlement(bookingId);
      toast({ title: "정산을 생성했습니다" });
    } catch (err) {
      toast({
        title: "정산 재시도에 실패했습니다",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setRetryingId(null);
    }
  };

  if (gaps.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-warning-foreground">
        <AlertTriangle className="h-4 w-4 text-warning" />
        정산 누락 예약 ({gaps.length}건)
      </div>
      {gaps.map((booking) => {
        const tour = getTourById(booking.tourId);
        return (
          <Card key={booking.id} className="border-warning/40">
            <CardContent className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="line-clamp-1 text-sm font-semibold text-foreground">
                  {tour?.title ?? "알 수 없는 투어"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {booking.diverName} · {formatDateKR(booking.createdAt)} · {formatKRW(booking.totalPaid)}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                정산 없음
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 gap-1 text-xs"
                disabled={retryingId === booking.id}
                onClick={() => void handleRetry(booking.id)}
              >
                <RotateCw className="h-3.5 w-3.5" />
                {retryingId === booking.id ? "재시도 중..." : "정산 재시도"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
