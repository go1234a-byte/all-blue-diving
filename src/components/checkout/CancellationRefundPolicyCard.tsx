import { ShieldAlert } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { CANCELLATION_POLICY_LINES, CANCELLATION_POLICY_NOTE } from "@/lib/refund";

interface CancellationRefundPolicyCardProps {
  agreed: boolean;
  onAgreedChange: (agreed: boolean) => void;
}

/**
 * 결제창 필수 고지 — "취소 및 환불 규정" 프리미엄 프로스티드 글라스 카드.
 * 체크박스 동의 전까지 최종 결제 버튼이 비활성화되는 가드레일의 UI 소스.
 */
export function CancellationRefundPolicyCard({ agreed, onAgreedChange }: CancellationRefundPolicyCardProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-primary/30 bg-card/70 p-4 shadow-ocean backdrop-blur-md">
      <h3 className="flex items-center gap-1.5 break-keep text-sm font-semibold text-foreground">
        <ShieldAlert className="h-4 w-4 text-primary" />
        취소 및 환불 규정
      </h3>

      <div className="space-y-1">
        {CANCELLATION_POLICY_LINES.map((line) => (
          <p key={line} className="break-keep text-xs leading-relaxed text-muted-foreground">
            {line}
          </p>
        ))}
      </div>

      <p className="break-keep text-[11px] leading-relaxed text-muted-foreground/80">
        {CANCELLATION_POLICY_NOTE}
      </p>

      <label className="flex items-start gap-2.5 rounded-xl border border-primary/40 bg-background/60 p-3 text-sm">
        <Checkbox
          checked={agreed}
          onCheckedChange={(checked) => onAgreedChange(checked === true)}
          className="mt-0.5 shrink-0"
        />
        <span className="break-keep text-foreground">
          <span className="font-semibold text-destructive">[필수]</span> 취소 및 환불 규정을 충분히
          확인하였으며 이에 동의합니다.
        </span>
      </label>
    </div>
  );
}
