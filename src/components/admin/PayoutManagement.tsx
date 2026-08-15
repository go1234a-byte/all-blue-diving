import { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { formatKRW } from "@/lib/pricing";
import type { PayoutStatus } from "@/types";

const STATUS_LABEL: Record<PayoutStatus, string> = {
  scheduled: "정산 예정",
  held: "정산 보류",
  released: "정산 완료",
  cancelled: "취소됨(환불)",
};

const STATUS_VARIANT: Record<PayoutStatus, "default" | "secondary" | "destructive"> = {
  scheduled: "secondary",
  held: "destructive",
  released: "default",
  cancelled: "secondary",
};

/** 모바일 폭에 맞춘 카드형 정산 목록 — 기존 데스크톱 표 대신 사용한다. */
export function PayoutManagement() {
  const { payouts, instructors, setPayoutStatus } = useAppData();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (payoutId: string, status: PayoutStatus, successLabel: string) => {
    setUpdatingId(payoutId);
    try {
      await setPayoutStatus(payoutId, status);
      toast({ title: successLabel });
    } catch (err) {
      toast({
        title: "정산 상태 변경에 실패했습니다",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-2">
      {payouts.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">정산 내역이 없습니다.</p>
      )}
      {payouts.map((payout) => {
        const instructor = instructors.find((i) => i.id === payout.instructorId);
        const grossAmount = payout.firstAmount + payout.secondAmount;
        // 원천징수 관련 값은 payouts_directory 뷰에서 본인 강사/관리자에게만 내려온다.
        // 관리자 화면이므로 값이 있으면(undefined가 아니면) 표시한다.
        const hasWithholdingInfo = payout.withholdingTaxAmount !== undefined && payout.netPayoutAmount !== undefined;
        return (
          <div
            key={payout.id}
            className={`space-y-2 rounded-xl border p-3 ${
              payout.id === highlightId ? "border-primary bg-secondary/60" : "border-border bg-card"
            }`}
          >
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
            {hasWithholdingInfo ? (
              <div className="space-y-1 rounded-lg bg-secondary/40 p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    원천징수세액 ({((payout.withholdingTaxRate ?? 0) * 100).toFixed(1)}%)
                  </span>
                  <span className="font-medium text-foreground">
                    -{formatKRW(payout.withholdingTaxAmount ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">실지급액</span>
                  <span className="font-bold text-foreground">{formatKRW(payout.netPayoutAmount ?? grossAmount)}</span>
                </div>
                {!payout.businessTypeAtPayout && (
                  <p className="pt-0.5 text-[10px] text-destructive">
                    ⚠ 강사 사업자유형 미입력 상태로 지급되어 원천징수가 적용되지 않았습니다.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground">
                원천징수 정보 없음 (정산 정책 적용 이전 건)
              </p>
            )}
            {payout.status === "held" && (
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1 text-xs"
                disabled={updatingId === payout.id}
                onClick={() => void handleStatusChange(payout.id, "released", "정산 보류를 해제했습니다.")}
              >
                <Unlock className="h-3.5 w-3.5" />
                보류 해제
              </Button>
            )}
            {payout.status === "scheduled" && (
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1 text-xs"
                  disabled={updatingId === payout.id}
                  onClick={() => void handleStatusChange(payout.id, "released", "정산을 즉시 승인했습니다.")}
                >
                  <Unlock className="h-3.5 w-3.5" />
                  즉시 승인
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 gap-1 text-xs"
                  disabled={updatingId === payout.id}
                  onClick={() => void handleStatusChange(payout.id, "held", "정산을 보류 처리했습니다.")}
                >
                  <Lock className="h-3.5 w-3.5" />
                  정산 보류
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
