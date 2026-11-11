import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/layout/BottomNav";
import { supabase } from "@/integrations/supabase/client";

const FRIENDLY_MESSAGES: Record<string, string> = {
  USER_CANCEL: "결제를 취소하셨습니다.",
  INVALID_CARD_EXPIRATION: "카드 유효기간이 올바르지 않습니다.",
  EXCEED_MAX_DAILY_PAYMENT_COUNT: "일일 결제 한도를 초과했습니다.",
  NOT_AVAILABLE_PAYMENT: "이용할 수 없는 결제수단입니다.",
  REJECT_CARD_PAYMENT: "카드 한도초과 또는 잔액부족으로 결제에 실패했습니다.",
};

const PaymentFail = () => {
  const [searchParams] = useSearchParams();
  const [retryTourId, setRetryTourId] = useState<string | null>(null);

  const code = searchParams.get("code");
  const message = searchParams.get("message");
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (!orderId) return;
    // 주문은 서버에 저장돼 있다 — 어느 투어였는지만 읽어 "다시 결제" 버튼에 쓴다.
    void supabase
      .from("payment_orders" as never)
      .select("tour_id")
      .eq("order_id", orderId)
      .maybeSingle()
      .then(({ data }) => {
        const row = data as { tour_id?: string } | null;
        if (row?.tour_id) setRetryTourId(row.tour_id);
      });
  }, [orderId]);

  const friendlyMessage = (code && FRIENDLY_MESSAGES[code]) ?? message ?? "결제가 완료되지 않았습니다.";

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3 bg-gradient-surface p-6 text-center">
      <XCircle className="h-10 w-10 text-destructive" />
      <p className="text-base font-semibold text-foreground">결제가 완료되지 않았습니다</p>
      <p className="max-w-xs text-sm text-muted-foreground">{friendlyMessage}</p>

      <div className="flex gap-2 pt-2">
        {retryTourId && (
          <Button variant="cta" asChild>
            <Link to={`/checkout/${retryTourId}`}>다시 결제하기</Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link to="/">홈으로</Link>
        </Button>
      </div>
      <BottomNav />
    </div>
  );
};

export default PaymentFail;
