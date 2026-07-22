import { useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { InclusionsExclusionsCard } from "@/components/tour/InclusionsExclusionsCard";
import { TourOptionsSelector } from "@/components/tour/TourOptionsSelector";
import { PaymentReceiptBreakdown } from "@/components/checkout/PaymentReceiptBreakdown";
import { CancellationRefundPolicyCard } from "@/components/checkout/CancellationRefundPolicyCard";
import { PolicyDisclosure } from "@/components/policy/PolicyDisclosure";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { computeInvoice, formatKRW, validateAndComputeCouponDiscount } from "@/lib/pricing";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { handleImageFallback, IMAGE_PLACEHOLDER } from "@/lib/image";
import type { Gender } from "@/types";

const Checkout = () => {
  const { tourId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getTourById, getCouponByCode, addBooking, redeemCoupon } = useAppData();
  const { profile, currentDiverId } = useRole();

  const tour = tourId ? getTourById(tourId) : undefined;
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(
    (location.state as { selectedOptionIds?: string[] } | null)?.selectedOptionIds ?? [],
  );
  const [gender, setGender] = useState<Gender>("male");
  const [snoring, setSnoring] = useState(false);
  const [smoking, setSmoking] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [confirmedInclusions, setConfirmedInclusions] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; amount: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  if (!tour) {
    return (
      <div className="flex min-h-full items-center justify-center p-6 text-sm text-muted-foreground">
        투어 정보를 찾을 수 없습니다.
      </div>
    );
  }

  const selectedOptions = tour.customOptions
    .filter((o) => o.isActive && selectedOptionIds.includes(o.id))
    .map((o) => ({ name: o.name, price: o.price }));

  const invoice = computeInvoice(
    tour.basePrice,
    selectedOptions,
    appliedCoupon ?? undefined,
  );

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    const coupon = getCouponByCode(couponInput);
    const subtotal = tour.basePrice + selectedOptions.reduce((sum, o) => sum + o.price, 0);
    const result = validateAndComputeCouponDiscount(coupon, subtotal);
    if (!result.valid || !coupon) {
      setAppliedCoupon(null);
      setCouponMessage(result.message ?? "사용할 수 없는 쿠폰입니다.");
      return;
    }
    setAppliedCoupon({ code: coupon.code, amount: result.discountAmount });
    setCouponMessage(`${formatKRW(result.discountAmount)} 할인이 적용되었습니다.`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponMessage(null);
    setCouponInput("");
  };

  // TODO: 실제 토스페이먼츠 연동 복구 시 이 함수를 TossPaymentWidget.requestPayment() 흐름으로 되돌릴 것.
  // 지금은 결제위젯 없이 "결제 완료"로 바로 처리하는 임시(테스트) 모드다.
  const handlePay = async () => {
    if (tour.adminStatus) {
      toast({
        title: tour.adminStatus === "suspended" ? "정지된 투어예요" : "보류중인 투어예요",
        description: "현재 예약을 받을 수 없는 투어입니다.",
        variant: "destructive",
      });
      return;
    }
    setProcessing(true);
    try {
      const created = await addBooking({
        tourId: tour.id,
        diverId: currentDiverId || undefined,
        diverName: profile?.name ?? "게스트 다이버",
        basePrice: invoice.basePrice,
        optionsCost: invoice.optionsCost,
        selectedOptions: invoice.selectedOptions,
        platformFee: invoice.platformFee,
        totalPaid: invoice.totalDue,
        onSiteBalance: invoice.onSiteBalance,
        couponCode: invoice.couponCode,
        discountAmount: invoice.discountAmount,
        paymentMethod: "card",
        gender,
        snoring,
        smoking,
      });

      if (invoice.couponCode) {
        const coupon = getCouponByCode(invoice.couponCode);
        if (coupon) void redeemCoupon(coupon.id);
      }

      navigate(`/payment/success?mock=1&bookingId=${created.id}`);
    } catch (err) {
      toast({
        title: "예약 생성에 실패했습니다",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-surface pb-28">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-md items-center gap-3 px-4 md:max-w-lg">
          <Link to={`/tour/${tour.id}`} className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-semibold text-foreground">예약 및 결제</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md space-y-5 px-4 py-5 md:max-w-lg">
        <Card>
          <CardContent className="flex gap-3 p-4">
            <img
              src={tour.mainImageUrl || IMAGE_PLACEHOLDER}
              alt={tour.title}
              onError={handleImageFallback}
              className="h-16 w-16 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <p className="line-clamp-1 text-sm font-semibold text-foreground">{tour.title}</p>
              <p className="text-xs text-muted-foreground">{tour.country} · {tour.site}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <h3 className="text-sm font-semibold text-foreground">참가자 정보 (룸 배정용)</h3>
            <div className="space-y-1.5">
              <Label>성별</Label>
              <RadioGroup value={gender} onValueChange={(v) => setGender(v as Gender)} className="flex gap-4">
                <label className="flex items-center gap-1.5 text-sm">
                  <RadioGroupItem value="male" /> 남성
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <RadioGroupItem value="female" /> 여성
                </label>
              </RadioGroup>
            </div>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={snoring} onChange={(e) => setSnoring(e.target.checked)} />
                코골이 있음
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={smoking} onChange={(e) => setSmoking(e.target.checked)} />
                흡연자
              </label>
            </div>
          </CardContent>
        </Card>

        <InclusionsExclusionsCard inclusions={tour.inclusions} exclusions={tour.exclusions} />

        <TourOptionsSelector
          options={tour.customOptions}
          selectedIds={selectedOptionIds}
          onChange={setSelectedOptionIds}
        />

        <label className="flex items-start gap-2.5 rounded-xl border-2 border-primary/40 bg-card p-4 text-sm">
          <Checkbox
            checked={confirmedInclusions}
            onCheckedChange={(checked) => setConfirmedInclusions(checked === true)}
            className="mt-0.5"
          />
          <span className="text-foreground">
            <span className="font-semibold text-destructive">[필수]</span> 위 포함 및 불포함 사항을 확인했습니다.
          </span>
        </label>

        <Card>
          <CardContent className="space-y-2.5 p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Tag className="h-4 w-4 text-primary" />
              쿠폰 적용
            </h3>
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-secondary/40 px-3 py-2">
                <span className="font-mono text-sm font-semibold text-primary">{appliedCoupon.code}</span>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={handleRemoveCoupon}>
                  적용 취소
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="쿠폰 코드 입력"
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleApplyCoupon}>
                  적용
                </Button>
              </div>
            )}
            {couponMessage && (
              <p className={cn("text-xs", appliedCoupon ? "text-primary" : "text-destructive")}>{couponMessage}</p>
            )}
          </CardContent>
        </Card>

        <PaymentReceiptBreakdown tourTitle={tour.title} invoice={invoice} />

        <Card className="border-dashed border-primary/40 bg-secondary/30">
          <CardContent className="space-y-1 p-4">
            <h3 className="text-sm font-semibold text-foreground">결제 수단</h3>
            <p className="text-xs text-muted-foreground">
              테스트 모드: 실제 결제 연동 전까지 [결제하기]를 누르면 바로 결제 완료로 처리됩니다.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">주요 정책 및 위반 규정</h3>
          <PolicyDisclosure />
        </div>

        <CancellationRefundPolicyCard agreed={agreedToPolicy} onAgreedChange={setAgreedToPolicy} />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-border bg-card/95 px-4 py-3 backdrop-blur md:max-w-lg">
        <Button
          variant="coral"
          size="lg"
          className="w-full"
          onClick={handlePay}
          disabled={processing || !agreedToPolicy || !confirmedInclusions}
        >
          {processing
            ? "결제 처리 중..."
            : !confirmedInclusions
              ? "포함/불포함 사항을 확인해주세요"
              : agreedToPolicy
                ? `${formatKRW(invoice.totalDue)} 결제하기`
                : "취소 및 환불 규정에 동의해주세요"}
        </Button>
      </div>
    </div>
  );
};

export default Checkout;
