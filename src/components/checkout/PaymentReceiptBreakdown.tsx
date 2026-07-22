import { Receipt } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatKRW } from "@/lib/pricing";
import type { Invoice } from "@/types";

interface PaymentReceiptBreakdownProps {
  tourTitle: string;
  invoice: Invoice;
}

/**
 * "최종 결제 영수증 상세 내역" — 체크아웃 성공 팝업과 내 예약 내역 상세 패널에서 공통으로 사용.
 * 투어 기본 금액, 선택 옵션별 금액, 소계, 플랫폼 수수료, 최종 결제 금액을 명시적으로 표기한다.
 */
export function PaymentReceiptBreakdown({ tourTitle, invoice }: PaymentReceiptBreakdownProps) {
  const subtotal = invoice.basePrice + invoice.optionsCost;

  return (
    <div className="w-full space-y-2.5 rounded-xl border border-primary/30 bg-card p-3 text-left">
      <p className="flex items-center gap-1.5 break-keep text-sm font-semibold text-foreground">
        <Receipt className="h-4 w-4 text-primary" />
        최종 결제 영수증 상세 내역
      </p>

      <div className="space-y-1 text-xs">
        <p className="line-clamp-2 break-keep font-medium text-foreground">{tourTitle}</p>
        <div className="flex justify-between text-muted-foreground">
          <span>투어 기본 금액</span>
          <span>{formatKRW(invoice.basePrice)}</span>
        </div>
        {invoice.selectedOptions.map((option) => (
          <div key={option.name} className="flex justify-between text-muted-foreground">
            <span className="break-keep">• {option.name} 추가</span>
            <span>+{formatKRW(option.price)}</span>
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-1 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>투어 금액 소계</span>
          <span>{formatKRW(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>플랫폼 수수료 10%</span>
          <span>+{formatKRW(invoice.platformFee)}</span>
        </div>
        {invoice.discountAmount !== undefined && invoice.discountAmount > 0 && (
          <div className="flex justify-between font-medium text-primary">
            <span>쿠폰 할인{invoice.couponCode ? ` (${invoice.couponCode})` : ""}</span>
            <span>-{formatKRW(invoice.discountAmount)}</span>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">최종 총 결제 금액</span>
        <span className="text-base font-bold text-primary">{formatKRW(invoice.totalDue)}</span>
      </div>
    </div>
  );
}
