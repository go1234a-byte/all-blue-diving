import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDiverWish } from "@/contexts/DiverWishContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * 정원이 찬 투어의 "빈자리 나면 알려주세요". 확정 예약이 취소되는 순간 DB 트리거가
 * 알림함에 알림을 넣는다(1회). 다시 받으려면 다시 누르면 된다.
 */
export function SeatAlertButton({ tourId, className }: { tourId: string; className?: string }) {
  const { available, seatAlertTourIds, toggleSeatAlert } = useDiverWish();
  const { isLoggedIn } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  // 알림 테이블이 아직 없으면(마이그레이션 전) 예전처럼 비활성 "예약 불가" 버튼으로 둔다 —
  // null 을 돌려주면 정원 찬 투어의 하단 버튼 자리가 통째로 비어 버린다.
  if (!available) {
    return (
      <Button type="button" disabled className={className}>
        예약 불가 (정원 마감)
      </Button>
    );
  }
  const on = seatAlertTourIds.has(tourId);

  return (
    <Button
      type="button"
      variant={on ? "outline" : "default"}
      disabled={busy}
      className={cn("gap-1.5", className)}
      onClick={async () => {
        if (!isLoggedIn) {
          toast({ title: "로그인하면 빈자리 알림을 받을 수 있어요" });
          navigate("/auth");
          return;
        }
        setBusy(true);
        try {
          const next = await toggleSeatAlert(tourId);
          toast({
            title: next ? "빈자리가 나면 바로 알려드릴게요" : "빈자리 알림을 껐어요",
            description: next ? "취소자가 생기면 홈 상단과 알림함에 표시됩니다." : undefined,
          });
        } catch {
          toast({ title: "설정하지 못했어요", description: "잠시 후 다시 시도해주세요.", variant: "destructive" });
        } finally {
          setBusy(false);
        }
      }}
    >
      {on ? <BellOff className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
      {on ? "빈자리 알림 대기 중 · 끄기" : "빈자리 나면 알림 받기"}
    </Button>
  );
}
