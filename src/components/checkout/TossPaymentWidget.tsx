import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TOSS_CLIENT_KEY } from "@/lib/payment";

// 토스페이먼츠 결제위젯 SDK 타입은 공식 타입 정의가 제한적이라 필요한 형태만 최소로 선언한다.
interface TossWidgetsInstance {
  setAmount: (amount: { currency: "KRW"; value: number }) => Promise<void>;
  renderPaymentMethods: (params: { selector: string; variantKey?: string }) => Promise<unknown>;
  renderAgreement: (params: { selector: string; variantKey?: string }) => Promise<unknown>;
  requestPayment: (params: {
    orderId: string;
    orderName: string;
    successUrl: string;
    failUrl: string;
    customerEmail?: string;
    customerName?: string;
  }) => Promise<void>;
}
interface TossPaymentsSdk {
  widgets: (params: { customerKey: string }) => TossWidgetsInstance;
}

export interface TossPaymentWidgetHandle {
  requestPayment: (params: {
    orderId: string;
    orderName: string;
    successUrl: string;
    failUrl: string;
    customerEmail?: string;
    customerName?: string;
  }) => Promise<void>;
  ready: boolean;
}

interface TossPaymentWidgetProps {
  amount: number;
  customerKey: string;
}

/**
 * 토스페이먼츠 결제위젯(V2, 주문서형) 임베드 컴포넌트.
 * VITE_TOSS_CLIENT_KEY가 없으면 위젯 대신 안내 카드를 보여준다.
 */
export const TossPaymentWidget = forwardRef<TossPaymentWidgetHandle, TossPaymentWidgetProps>(
  function TossPaymentWidget({ amount, customerKey }, ref) {
    const widgetsRef = useRef<TossWidgetsInstance | null>(null);
    const [ready, setReady] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
      if (!TOSS_CLIENT_KEY) return;
      let cancelled = false;

      (async () => {
        try {
          const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
          const tossPayments = (await loadTossPayments(TOSS_CLIENT_KEY)) as unknown as TossPaymentsSdk;
          if (cancelled) return;

          const widgets = tossPayments.widgets({ customerKey });
          widgetsRef.current = widgets;

          await widgets.setAmount({ currency: "KRW", value: Math.max(0, Math.round(amount)) });
          await widgets.renderPaymentMethods({ selector: "#toss-payment-method", variantKey: "DEFAULT" });
          await widgets.renderAgreement({ selector: "#toss-agreement", variantKey: "AGREEMENT" });

          if (!cancelled) setReady(true);
        } catch (err) {
          if (!cancelled) {
            setLoadError(err instanceof Error ? err.message : "결제위젯을 불러오지 못했습니다.");
          }
        }
      })();

      return () => {
        cancelled = true;
      };
      // customerKey가 바뀌면(로그인 상태 변경 등) 위젯을 다시 초기화해야 하므로 의존성에 포함.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerKey]);

    // 쿠폰 적용 등으로 결제 금액이 바뀌면 위젯에도 반영한다.
    useEffect(() => {
      if (!ready || !widgetsRef.current) return;
      void widgetsRef.current.setAmount({ currency: "KRW", value: Math.max(0, Math.round(amount)) });
    }, [amount, ready]);

    useImperativeHandle(ref, () => ({
      ready,
      requestPayment: async (params) => {
        if (!widgetsRef.current) {
          throw new Error("결제위젯이 아직 준비되지 않았습니다.");
        }
        await widgetsRef.current.requestPayment(params);
      },
    }));

    if (!TOSS_CLIENT_KEY) {
      return (
        <Card className="border-dashed border-warning/50 bg-warning/5">
          <CardContent className="flex items-start gap-2.5 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">결제 시스템 설정이 필요합니다</p>
              <p className="text-xs text-muted-foreground">
                토스페이먼츠 테스트 클라이언트 키(VITE_TOSS_CLIENT_KEY)가 아직 등록되지 않아 결제위젯을 표시할 수
                없습니다. 관리자에게 문의해주세요.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {loadError && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-3 text-xs text-destructive">{loadError}</CardContent>
          </Card>
        )}
        <div id="toss-payment-method" />
        <div id="toss-agreement" />
        {!ready && !loadError && (
          <p className="py-2 text-center text-xs text-muted-foreground">결제 수단을 불러오는 중...</p>
        )}
      </div>
    );
  },
);
