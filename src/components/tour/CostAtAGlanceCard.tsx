import { Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { applyPlatformFee, formatKRW } from "@/lib/pricing";
import type { Tour } from "@/types";

interface CostAtAGlanceCardProps {
  tour: Pick<Tour, "basePrice" | "customOptions" | "inclusions" | "exclusions">;
}

/**
 * 다이버가 예약 전에 가장 많이 묻는 "결국 얼마 드나요?"를 한 카드로 답한다.
 * 결제 금액(요금·선택 옵션)과 결제 외에 따로 드는 비용(불포함 항목)을 나눠 보여주고,
 * 가장 자주 빠지는 장비 렌탈 포함 여부를 따로 짚는다.
 */
export function CostAtAGlanceCard({ tour }: CostAtAGlanceCardProps) {
  const options = tour.customOptions.filter((o) => o.isActive);
  const base = applyPlatformFee(tour.basePrice);
  const max = applyPlatformFee(tour.basePrice + options.reduce((sum, o) => sum + o.price, 0));
  const mentions = (list: string[]) => list.some((item) => item.includes("장비"));
  const equipment = mentions(tour.inclusions) ? "포함" : mentions(tour.exclusions) ? "별도 (현지 렌탈)" : "강사에게 확인";

  return (
    <Card className="border-2 border-primary/40">
      <CardContent className="space-y-3 p-4">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Wallet className="h-4 w-4 text-primary" />
          총비용 한눈에
        </h3>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">투어 요금 (1인 · 수수료 포함)</dt>
            <dd className="font-semibold text-foreground">{formatKRW(base)}</dd>
          </div>
          {options.length > 0 && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">선택 옵션 모두 고르면</dt>
              <dd className="font-semibold text-foreground">최대 {formatKRW(max)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">장비 렌탈</dt>
            <dd className="font-semibold text-foreground">{equipment}</dd>
          </div>
        </dl>
        {tour.exclusions.length > 0 && (
          <div className="space-y-1.5 border-t border-border pt-3">
            <p className="text-xs font-semibold text-foreground">결제 금액 외에 따로 드는 비용</p>
            <div className="flex flex-wrap gap-1.5">
              {tour.exclusions.map((item) => (
                <span key={item} className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">
          여기 없는 추가 요금(1인 참가, 장비 분실 등)이 있는지는 예약 전에 강사에게 채팅으로 확인하세요.
        </p>
      </CardContent>
    </Card>
  );
}
