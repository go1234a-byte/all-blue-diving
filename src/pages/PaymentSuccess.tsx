import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/layout/BottomNav";
import { CalendarSyncButtons } from "@/components/checkout/CalendarSyncButtons";
import { PaymentReceiptBreakdown } from "@/components/checkout/PaymentReceiptBreakdown";
import { useAppData } from "@/contexts/AppDataContext";
import { buildTourCalendarEvent } from "@/lib/calendar";
import {
  clearPendingBooking,
  loadPendingBooking,
  mapTossMethodToPaymentMethod,
  verifyTossPayment,
} from "@/lib/payment";
import type { Booking, Invoice } from "@/types";

type Status = "verifying" | "success" | "skeleton" | "error";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getTourById, getInstructorById, addBooking, getCouponByCode, redeemCoupon, bookings } = useAppData();

  const [status, setStatus] = useState<Status>("verifying");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const ranRef = useRef(false);

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  // 테스트 모드(Checkout.tsx의 임시 결제 우회)로 들어온 경우: 서버 검증 없이 이미 생성된 예약을 그대로 보여준다.
  // TODO: 실제 토스페이먼츠 연동 복구 시 이 mock 분기를 제거할 것.
  const mockBookingId = searchParams.get("mock") === "1" ? searchParams.get("bookingId") : null;

  useEffect(() => {
    // React StrictMode/재렌더링으로 중복 실행되어 결제 승인이 두 번 요청되는 것을 방지한다.
    if (ranRef.current) return;
    ranRef.current = true;

    if (mockBookingId) {
      const existing = bookings.find((b) => b.id === mockBookingId);
      if (existing) {
        setBooking(existing);
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage("예약 정보를 찾을 수 없습니다.");
      }
      return;
    }

    (async () => {
      if (!paymentKey || !orderId || !amount) {
        setStatus("error");
        setErrorMessage("잘못된 접근입니다. 결제 정보가 없습니다.");
        return;
      }

      const pending = loadPendingBooking(orderId);
      if (!pending) {
        setStatus("error");
        setErrorMessage("예약 정보를 찾을 수 없습니다. 브라우저를 변경했거나 정보가 만료되었을 수 있어요.");
        return;
      }

      const result = await verifyTossPayment({ paymentKey, orderId, amount: Number(amount) });

      if (result.skeleton) {
        setStatus("skeleton");
        return;
      }

      if (!result.verified) {
        setStatus("error");
        setErrorMessage(result.message ?? result.error ?? "결제 승인 검증에 실패했습니다.");
        return;
      }

      try {
        const paymentMethod = mapTossMethodToPaymentMethod(result.method, result.easyPayProvider);
        const created = await addBooking({ ...pending, paymentMethod });

        if (pending.couponCode) {
          const coupon = getCouponByCode(pending.couponCode);
          if (coupon) void redeemCoupon(coupon.id);
        }

        clearPendingBooking(orderId);
        setBooking(created);
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "예약 생성 중 오류가 발생했습니다.");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })();
  }, [paymentKey, orderId, amount]);

  if (status === "verifying") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 bg-gradient-surface p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">결제를 확인하고 있습니다...</p>
      </div>
    );
  }

  if (status === "skeleton") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 bg-gradient-surface p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-warning" />
        <p className="text-sm font-semibold text-foreground">결제 시스템 설정이 아직 완료되지 않았습니다</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          토스페이먼츠 시크릿 키가 서버에 등록되지 않아 결제 승인 검증을 완료할 수 없습니다. 관리자에게
          TOSS_SECRET_KEY 등록을 요청해주세요.
        </p>
        <Button variant="outline" onClick={() => navigate("/")}>
          홈으로 돌아가기
        </Button>
        <BottomNav />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 bg-gradient-surface p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-semibold text-foreground">결제 확인에 실패했습니다</p>
        <p className="max-w-xs text-xs text-muted-foreground">{errorMessage}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/my-bookings")}>
            내 예약 확인
          </Button>
          <Button onClick={() => navigate("/")}>홈으로</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // status === "success"
  const tour = booking ? getTourById(booking.tourId) : undefined;
  const instructor = tour ? getInstructorById(tour.instructorId) : undefined;
  const invoice: Invoice | null = booking
    ? {
        basePrice: booking.basePrice,
        optionsCost: booking.optionsCost,
        selectedOptions: booking.selectedOptions,
        platformFee: booking.platformFee,
        totalDue: booking.totalPaid,
        onSiteBalance: booking.onSiteBalance,
        couponCode: booking.couponCode,
        discountAmount: booking.discountAmount,
      }
    : null;

  return (
    <div className="min-h-full bg-gradient-surface pb-24">
      <main className="mx-auto w-full max-w-md space-y-4 px-4 py-8 md:max-w-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h1 className="text-center text-lg font-semibold text-foreground">결제 및 예약 완료!</h1>
        <p className="text-center text-sm text-muted-foreground">
          투어 전액 결제가 완료되었습니다. 현장 지불 잔금은 0원입니다.
        </p>

        {tour && invoice && <PaymentReceiptBreakdown tourTitle={tour.title} invoice={invoice} />}

        <div className="space-y-1.5 rounded-xl border border-success/30 bg-success/10 p-3 text-left">
          {["포함/불포함 사항 확인 완료", "예약 확정 및 강사 매칭 완료"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs font-medium text-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
              {item}
            </div>
          ))}
        </div>

        {tour && instructor && invoice && (
          <div className="w-full space-y-2 rounded-xl border border-primary/30 bg-secondary/40 p-3">
            <p className="w-full whitespace-normal break-keep px-2 text-center text-sm tracking-tight text-foreground sm:text-base">
              투어 일정을 캘린더에 저장하세요
            </p>
            <CalendarSyncButtons event={buildTourCalendarEvent(tour, instructor.name, invoice)} />
          </div>
        )}

        {tour && (
          <Button variant="outline" className="w-full gap-2" onClick={() => navigate(`/chat/${tour.id}`)}>
            <MessageCircle className="h-4 w-4" />
            예약자 전용 그룹채팅방 입장하기
          </Button>
        )}
        <Button className="w-full" onClick={() => navigate("/my-bookings")}>
          내 예약 확인하기
        </Button>
        <Link to="/" className="block text-center text-xs text-muted-foreground underline underline-offset-4">
          홈으로 돌아가기
        </Link>
      </main>
      <BottomNav />
    </div>
  );
};

export default PaymentSuccess;
