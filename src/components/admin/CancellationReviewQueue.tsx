import { AlertTriangle, CheckCircle2, MessagesSquare, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateKR } from "@/lib/dates";

/**
 * 관리자용 취소 심사 큐. status === 'cancel_pending_review'인 예약을 나열하고,
 * 다이버 증빙 자료와 강사 측 중재방 반박 자료를 함께 확인한 뒤
 * 승인(강제 환불) / 반려(예약 유지)를 처리한다.
 */
export function CancellationReviewQueue() {
  const { bookings, getTourById, resolveCancellationReview, arbitrationMessages } = useAppData();
  const pending = bookings.filter((b) => b.status === "cancel_pending_review");

  if (pending.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">대기중인 취소 심사 요청이 없습니다.</p>
    );
  }

  return (
    <div className="space-y-2">
      {pending.map((booking) => {
        const tour = getTourById(booking.tourId);
        const instructorEvidenceCount = tour
          ? arbitrationMessages.filter(
              (m) => m.instructorId === tour.instructorId && m.attachmentNames && m.attachmentNames.length > 0,
            ).length
          : 0;

        return (
          <Card key={booking.id} className="border-warning/40">
            <CardContent className="space-y-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold text-foreground">
                    {tour?.title ?? "알 수 없는 투어"}
                  </p>
                  <p className="text-xs text-muted-foreground">예약자: {booking.diverName}</p>
                </div>
                <Badge variant="secondary" className="shrink-0 gap-1 text-[10px]">
                  <AlertTriangle className="h-3 w-3" />
                  심사 대기
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="space-y-1 rounded-lg bg-secondary/50 p-2 text-xs text-muted-foreground">
                  <p className="break-keep font-semibold text-foreground">📸 다이버 제출 증빙</p>
                  <p className="break-keep">사유: {booking.cancelReason}</p>
                  <p className="break-keep">
                    첨부파일: {booking.evidenceFileNames?.join(", ") || "제출된 파일 없음"}
                  </p>
                  {booking.cancelRequestedAt && <p>요청일: {formatDateKR(booking.cancelRequestedAt)}</p>}
                </div>
                <div className="space-y-1 rounded-lg bg-secondary/50 p-2 text-xs text-muted-foreground">
                  <p className="break-keep font-semibold text-foreground">🛡️ 강사 측 반박 자료</p>
                  <p className="break-keep">
                    중재방 내 첨부 메시지: {instructorEvidenceCount}건
                  </p>
                  {tour && (
                    <Button size="sm" variant="outline" className="mt-1 h-7 w-full gap-1 text-[11px]" asChild>
                      <Link to={`/admin/arbitration/${tour.instructorId}`}>
                        <MessagesSquare className="h-3 w-3" />
                        중재방 입장 (강사 측 증빙 확인)
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                  onClick={() => resolveCancellationReview(booking.id, true)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  중재 결정: 강제 환불 승인
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 gap-1 text-xs"
                  onClick={() => resolveCancellationReview(booking.id, false)}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  중재 결정: 기각
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
