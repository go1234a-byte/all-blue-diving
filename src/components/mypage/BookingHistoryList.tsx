import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewDialog } from "@/components/mypage/ReviewDialog";
import { InquiryDialog } from "@/components/mypage/InquiryDialog";
import { CancelBookingDialog } from "@/components/mypage/CancelBookingDialog";
import { PaymentReceiptBreakdown } from "@/components/checkout/PaymentReceiptBreakdown";
import { useAppData } from "@/contexts/AppDataContext";
import { formatKRW } from "@/lib/pricing";
import { formatDateRangeKR, hoursSince } from "@/lib/dates";
import { handleImageFallback, IMAGE_PLACEHOLDER } from "@/lib/image";
import type { Booking } from "@/types";

interface BookingHistoryListProps {
  diverId: string;
}

// 최종 확정된 6단계 상태 탭: 전체 / 예약완료 / 출발예정 / 진행중 / 종료 / 취소
type StatusTab = "all" | "confirmed" | "upcoming" | "ongoing" | "finished" | "cancelled";

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "confirmed", label: "예약완료" },
  { value: "upcoming", label: "출발예정" },
  { value: "ongoing", label: "진행중" },
  { value: "finished", label: "종료" },
  { value: "cancelled", label: "취소" },
];

const DEPARTURE_SOON_DAYS = 7;

const STATUS_LABEL: Record<StatusTab, string> = {
  all: "",
  confirmed: "예약완료",
  upcoming: "출발예정",
  ongoing: "진행중",
  finished: "투어 완료",
  cancelled: "취소",
};

const STATUS_VARIANT: Record<StatusTab, "secondary" | "default" | "outline" | "destructive"> = {
  all: "secondary",
  confirmed: "secondary",
  upcoming: "default",
  ongoing: "default",
  finished: "outline",
  cancelled: "destructive",
};

const INQUIRY_WINDOW_HOURS = 48;

function resolveStatus(booking: Booking, tourStartDate: string, tourEndDate: string): StatusTab {
  if (booking.status === "cancelled" || booking.status === "cancel_pending_review") return "cancelled";

  const now = Date.now();
  const start = new Date(tourStartDate).getTime();
  const end = new Date(tourEndDate).getTime();

  if (now > end) return "finished";
  if (now >= start) return "ongoing";

  const daysUntilStart = (start - now) / (1000 * 60 * 60 * 24);
  if (daysUntilStart <= DEPARTURE_SOON_DAYS) return "upcoming";
  return "confirmed";
}

export function BookingHistoryList({ diverId }: BookingHistoryListProps) {
  const { bookings, getTourById, getReviewByBookingId } = useAppData();
  const navigate = useNavigate();
  const myBookings = bookings.filter((b) => b.diverId === diverId);
  const [tab, setTab] = useState<StatusTab>("all");
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);
  const [inquiryTarget, setInquiryTarget] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [receiptOpenId, setReceiptOpenId] = useState<string | null>(null);
  const [refundOpenId, setRefundOpenId] = useState<string | null>(null);

  const withStatus = useMemo(
    () =>
      myBookings
        .map((booking) => {
          const tour = getTourById(booking.tourId);
          if (!tour) return null;
          return { booking, tour, status: resolveStatus(booking, tour.startDate, tour.endDate) };
        })
        .filter((item): item is { booking: Booking; tour: NonNullable<ReturnType<typeof getTourById>>; status: StatusTab } => item !== null),
    [myBookings, getTourById],
  );

  const filtered = tab === "all" ? withStatus : withStatus.filter((item) => item.status === tab);

  if (myBookings.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">아직 예약 내역이 없습니다.</p>
    );
  }

  return (
    <div className="space-y-3">
      <Tabs value={tab} onValueChange={(v) => setTab(v as StatusTab)}>
        <TabsList className="grid w-full grid-cols-3 gap-1 sm:grid-cols-6">
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="text-[11px]">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">해당 상태의 예약이 없습니다.</p>
        )}
        {filtered.map(({ booking, tour, status }) => {
          const canChat = status === "confirmed" || status === "upcoming" || status === "ongoing";
          const review = getReviewByBookingId(booking.id);
          const withinInquiryWindow = status === "finished" && hoursSince(tour.endDate) <= INQUIRY_WINDOW_HOURS;
          const receiptOpen = receiptOpenId === booking.id;
          const refundOpen = refundOpenId === booking.id;

          return (
            <Card key={booking.id} className="transition-shadow hover:shadow-ocean">
              <CardContent className="space-y-2 p-3">
                <Link to={`/tour/${tour.id}`} className="flex gap-3">
                  <img
                    src={tour.mainImageUrl || IMAGE_PLACEHOLDER}
                    alt={tour.title}
                    onError={handleImageFallback}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-semibold text-foreground">{tour.title}</p>
                      <Badge variant={STATUS_VARIANT[status]} className="shrink-0 text-[10px]">
                        {STATUS_LABEL[status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDateRangeKR(tour.startDate, tour.endDate)}</p>
                    <p className="text-xs font-bold text-primary">{formatKRW(booking.totalPaid)}</p>
                  </div>
                </Link>

                {booking.status === "cancel_pending_review" && (
                  <p className="break-keep rounded-lg bg-secondary px-2.5 py-1.5 text-[11px] text-muted-foreground">
                    사유: {booking.cancelReason} · 운영팀 심사 후 환불 여부가 결정됩니다.
                  </p>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full gap-1.5 text-xs text-muted-foreground"
                  onClick={() => setReceiptOpenId(receiptOpen ? null : booking.id)}
                >
                  <Receipt className="h-3.5 w-3.5" />
                  {receiptOpen ? "영수증 상세 닫기" : "영수증 상세 내역 보기"}
                </Button>

                {receiptOpen && (
                  <PaymentReceiptBreakdown
                    tourTitle={tour.title}
                    invoice={{
                      basePrice: booking.basePrice,
                      optionsCost: booking.optionsCost,
                      selectedOptions: booking.selectedOptions,
                      platformFee: booking.platformFee,
                      totalDue: booking.totalPaid,
                      onSiteBalance: booking.onSiteBalance,
                    }}
                  />
                )}

                {/* 상태별 하단 버튼: 예약완료/출발예정/진행중 → 그룹채팅, 종료 → 후기 작성, 취소 → 환불 내역 */}
                {canChat && (
                  <Button
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                    onClick={() => navigate(`/chat/${tour.id}?view=chat`)}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    예약 상세 그룹채팅
                  </Button>
                )}

                {status === "confirmed" || status === "upcoming" || status === "ongoing" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs text-destructive"
                    onClick={() => setCancelTarget(booking)}
                  >
                    예약 취소하기
                  </Button>
                ) : null}

                {status === "finished" && (
                  <div className="flex gap-2 border-t border-border pt-2">
                    <Button
                      size="sm"
                      variant={review ? "outline" : "secondary"}
                      className="flex-1 text-xs"
                      disabled={!!review}
                      onClick={() => setReviewTarget(booking)}
                    >
                      {review ? "평가 완료" : "후기 작성"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      disabled={!withinInquiryWindow}
                      onClick={() => setInquiryTarget(booking)}
                    >
                      문의하기
                    </Button>
                  </div>
                )}
                {status === "finished" && !withinInquiryWindow && (
                  <p className="text-[10px] text-muted-foreground">
                    문의하기는 투어 완료 후 {INQUIRY_WINDOW_HOURS}시간 이내에만 접수 가능합니다.
                  </p>
                )}

                {status === "cancelled" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => setRefundOpenId(refundOpen ? null : booking.id)}
                    >
                      환불 내역
                    </Button>
                    {refundOpen && (
                      <div className="space-y-1 rounded-lg bg-destructive/10 px-2.5 py-2 text-[11px] text-destructive">
                        {booking.refundAmount !== undefined ? (
                          <p>
                            환불율 {Math.round((booking.refundRate ?? 0) * 100)}% 적용 · 환불 금액{" "}
                            {formatKRW(booking.refundAmount)} 처리 완료
                          </p>
                        ) : (
                          <p>환불 심사가 진행 중입니다. 완료되면 환불 금액이 표시됩니다.</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="break-keep rounded-lg bg-secondary/50 px-3 py-2 text-center text-[11px] text-muted-foreground">
        예약 관련 문의는 ALL BLUE 운영팀을 이용해주세요.
      </p>

      {reviewTarget && (
        <ReviewDialog
          open={!!reviewTarget}
          onOpenChange={(open) => !open && setReviewTarget(null)}
          tourId={reviewTarget.tourId}
          bookingId={reviewTarget.id}
          diverId={diverId}
        />
      )}
      {inquiryTarget && (
        <InquiryDialog
          open={!!inquiryTarget}
          onOpenChange={(open) => !open && setInquiryTarget(null)}
          tourId={inquiryTarget.tourId}
          bookingId={inquiryTarget.id}
          diverId={diverId}
        />
      )}
      {cancelTarget && (
        (() => {
          const cancelTour = getTourById(cancelTarget.tourId);
          if (!cancelTour) return null;
          return (
            <CancelBookingDialog
              open={!!cancelTarget}
              onOpenChange={(open) => !open && setCancelTarget(null)}
              booking={cancelTarget}
              tour={cancelTour}
            />
          );
        })()
      )}
    </div>
  );
}
