import { Lock, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { formatKRW } from "@/lib/pricing";
import type { PayoutStatus } from "@/types";

const STATUS_LABEL: Record<PayoutStatus, string> = {
  scheduled: "정산 예정",
  held: "정산 보류",
  released: "정산 완료",
};

const STATUS_VARIANT: Record<PayoutStatus, "default" | "secondary" | "destructive"> = {
  scheduled: "secondary",
  held: "destructive",
  released: "default",
};

/** 모바일 폭에 맞춘 카드형 정산 목록 — 기존 데스크톱 표 대신 사용한다. */
export function PayoutManagement() {
  const { payouts, instructors, setPayoutStatus } = useAppData();

  return (
    <div className="space-y-2">
      {payouts.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">정산 내역이 없습니다.</p>
      )}
      {payouts.map((payout) => {
        const instructor = instructors.find((i) => i.id === payout.instructorId);
        return (
          <div key={payout.id} className="space-y-2 rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{instructor?.name ?? "-"}</p>
              <Badge variant={STATUS_VARIANT[payout.status]} className="shrink-0 text-[10px]">
                {STATUS_LABEL[payout.status]}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">1차 정산 (80%)</p>
                <p className="font-semibold text-foreground">{formatKRW(payout.firstAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">2차 정산 (20%)</p>
                <p className="font-semibold text-foreground">{formatKRW(payout.secondAmount)}</p>
              </div>
            </div>
            {payout.status === "held" ? (
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1 text-xs"
                onClick={() => setPayoutStatus(payout.id, "released")}
              >
                <Unlock className="h-3.5 w-3.5" />
                보류 해제
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                className="w-full gap-1 text-xs"
                onClick={() => setPayoutStatus(payout.id, "held")}
                disabled={payout.status === "released"}
              >
                <Lock className="h-3.5 w-3.5" />
                정산 보류
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
