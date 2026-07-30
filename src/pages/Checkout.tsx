import { useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { CompanionInfo, Gender } from "@/types";

interface ParticipantForm {
  /** 본인(index 0)은 항상 빈 문자열 — 동반자만 이름을 입력받는다. */
  name: string;
  gender: Gender;
  snoring: boolean;
  smoking: boolean;
  drinking: boolean;
  roomNote: string;
}

const createBlankParticipant = (): ParticipantForm => ({
  name: "",
  gender: "male",
  snoring: false,
  smoking: false,
  drinking: false,
  roomNote: "",
});

const Checkout = () => {
  const { tourId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getTourById, getCouponByCode, addBooking, redeemCoupon, toursLoading, getConfirmedParticipantCount } =
    useAppData();
  const { profile, currentDiverId, isLoggedIn, authLoading } = useRole();

  const tour = tourId ? getTourById(tourId) : undefined;
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(
    (location.state as { selectedOptionIds?: string[] } | null)?.selectedOptionIds ?? [],
  );
  const [participantCount, setParticipantCountState] = useState(1);
  // participants[0] = 예약자 본인, participants[1..] = 동반자. 인원 수(participantCount)와
  // 항상 길이가 같도록 setParticipantCount()를 통해서만 늘리고 줄인다 — 이미 입력한 값은
  // 유지한 채로 필요한 만큼만 추가/제거한다.
  const [participants, setParticipants] = useState<ParticipantForm[]>([createBlankParticipant()]);
  const setParticipantCount = (updater: number | ((current: number) => number)) => {
    setParticipantCountState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      const clamped = Math.max(1, next);
      setParticipants((prev) => {
        if (clamped === prev.length) return prev;
        if (clamped < prev.length) return prev.slice(0, clamped);
        return [...prev, ...Array.from({ length: clamped - prev.length }, createBlankParticipant)];
      });
      return clamped;
    });
  };
  const updateParticipant = (index: number, patch: Partial<ParticipantForm>) => {
    setParticipants((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };
  const [processing, setProcessing] = useState(false);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [confirmedInclusions, setConfirmedInclusions] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; amount: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  if (toursLoading && !tour) {
    return (
      <div className="flex min-h-full items-center justify-center p-6 text-sm text-muted-foreground">
        불러오는 중...
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="flex min-h-full items-center justify-center p-6 text-sm text-muted-foreground">
        투어 정보를 찾을 수 없습니다.
      </div>
    );
  }

  // bookings 배열은 RLS 때문에 이 투어의 담당 강사가 아닌 다이버에게는 다른 사람 예약이 안
  // 보이므로, 잔여 정원은 반드시 공개 집계 뷰 기반 헬퍼로 계산해야 한다(안 그러면 실제로는
  // 다 찬 투어인데도 예약이 더 들어가서 정원을 초과하게 된다).
  const confirmedCount = getConfirmedParticipantCount(tour.id);
  const remainingSlots = Math.max(0, tour.maxParticipants - confirmedCount);

  const selectedOptions = tour.customOptions
    .filter((o) => o.isActive && selectedOptionIds.includes(o.id))
    .map((o) => ({ name: o.name, price: o.price * participantCount }));

  const invoice = computeInvoice(
    tour.basePrice * participantCount,
    selectedOptions,
    appliedCoupon ?? undefined,
  );

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    const coupon = getCouponByCode(couponInput);
    const subtotal = tour.basePrice * participantCount + selectedOptions.reduce((sum, o) => sum + o.price, 0);
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
    if (participantCount > remainingSlots) {
      toast({
        title: "잔여 정원을 초과했어요",
        description: `현재 잔여 정원은 ${remainingSlots}명입니다. 인원 수를 줄여주세요.`,
        variant: "destructive",
      });
      return;
    }
    // 로그인 세션은 있어도(isLoggedIn) profiles 조회가 아직 끝나지 않아 currentDiverId가
    // 비어있는 타이밍(막 회원가입/로그인한 직후)에 결제를 진행하면, addBooking이 실제 로그인
    // 사용자가 아닌 임시 게스트 id를 만들어 bookings에 insert하게 되고, RLS 정책
    // (bookings_insert_self: diver_id = auth.uid())에 걸려 "row-level security policy" 에러로
    // 실패한다 — 여기서 미리 막아서 원인을 알 수 있는 안내로 대체한다.
    if (!isLoggedIn || !currentDiverId) {
      toast({
        title: "로그인이 필요해요",
        description: authLoading
          ? "로그인 정보를 확인하는 중이에요. 잠시 후 다시 시도해주세요."
          : "예약을 완료하려면 로그인 후 다시 시도해주세요.",
        variant: "destructive",
      });
      if (!authLoading) {
        navigate("/auth", {
          state: {
            returnTo: `/checkout/${tour.id}`,
            returnState: { selectedOptionIds },
            reason: "booking",
          },
        });
      }
      return;
    }
    setProcessing(true);
    try {
      const self = participants[0];
      const companions: CompanionInfo[] = participants.slice(1).map((p) => ({
        name: p.name.trim(),
        gender: p.gender,
        snoring: p.snoring,
        smoking: p.smoking,
        drinking: p.drinking,
        roomNote: p.roomNote.trim() || undefined,
      }));
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
        gender: self.gender,
        snoring: self.snoring,
        smoking: self.smoking,
        drinking: self.drinking,
        roomNote: self.roomNote.trim() || undefined,
        participantCount,
        companions: participantCount > 1 ? companions : undefined,
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
            <h3 className="text-sm font-semibold text-foreground">예약 인원</h3>
            <p className="text-xs text-muted-foreground">
              한 번의 예약으로 본인 포함 여러 명의 자리를 한 번에 결제할 수 있어요. 잔여 정원 {remainingSlots}명.
            </p>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => setParticipantCount((c) => Math.max(1, c - 1))}
                disabled={participantCount <= 1}
              >
                −
              </Button>
              <span className="w-10 text-center text-base font-semibold text-foreground">{participantCount}명</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => setParticipantCount((c) => Math.min(remainingSlots || 1, c + 1))}
                disabled={participantCount >= remainingSlots}
              >
                +
              </Button>
            </div>
          </CardContent>
        </Card>

        {participants.map((p, idx) => (
          <Card key={idx}>
            <CardContent className="space-y-3 p-4">
              <h3 className="text-sm font-semibold text-foreground">
                참가자 정보 (룸 배정용) · {idx === 0 ? "예약자 본인" : `동반자 ${idx}`}
              </h3>
              {idx > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">이름 (선택)</Label>
                  <Input
                    value={p.name}
                    onChange={(e) => updateParticipant(idx, { name: e.target.value })}
                    placeholder={`동반자 ${idx} 이름 (비워두면 "동반자 ${idx}"로 저장돼요)`}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>성별</Label>
                <RadioGroup
                  value={p.gender}
                  onValueChange={(v) => updateParticipant(idx, { gender: v as Gender })}
                  className="flex gap-4"
                >
                  <label className="flex items-center gap-1.5 text-sm">
                    <RadioGroupItem value="male" /> 남성
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <RadioGroupItem value="female" /> 여성
                  </label>
                </RadioGroup>
              </div>
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={p.snoring}
                    onChange={(e) => updateParticipant(idx, { snoring: e.target.checked })}
                  />
                  코골이 있음
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={p.smoking}
                    onChange={(e) => updateParticipant(idx, { smoking: e.target.checked })}
                  />
                  흡연자
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={p.drinking}
                    onChange={(e) => updateParticipant(idx, { drinking: e.target.checked })}
                  />
                  음주
                </label>
              </div>
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs text-muted-foreground">직접 입력 (선택)</Label>
                <Textarea
                  value={p.roomNote}
                  onChange={(e) => updateParticipant(idx, { roomNote: e.target.value })}
                  placeholder="룸 배정 시 참고할 사항을 자유롭게 입력해주세요 (예: 특정 인원과 같은 방 희망 등)"
                  className="min-h-16 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        ))}

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

        <PaymentReceiptBreakdown tourTitle={tour.title} invoice={invoice} participantCount={participantCount} />

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
          disabled={
            processing ||
            authLoading ||
            !agreedToPolicy ||
            !confirmedInclusions ||
            participantCount > remainingSlots ||
            remainingSlots < 1
          }
        >
          {processing
            ? "결제 처리 중..."
            : authLoading
              ? "로그인 정보 확인 중..."
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
