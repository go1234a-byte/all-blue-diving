import { useState } from "react";
import { AlertTriangle, CheckCircle2, MessagesSquare, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { formatDateKR } from "@/lib/dates";

/**
 * 관리자용 취소 심사 큐. status === 'cancel_pending_review'인 예약을 나열하고,
 * 다이버 증빙 자료와 강사 측 중재방 반박 자료를 함께 확인한 뒤
 * 승인(강제 환불) / 반려(예약 유지)를 처리한다.
 */
export function CancellationReviewQueue() {
  const { bookings, getTourById, resolveCancellationReview, arbitrationMessages } = useAppData();
  const { toast } = useToast();
  const pending = bookings.filter((b) => b.status === "cancel_pending_review");
  const [rejectReasonDrafts, setRejectReasonDrafts] = useState<Record<string, string>>({});

  // 예전엔 "강제 환불 승인"(실제 돈이 움직이는 되돌릴 수 없는 조치)이 확인창도 없이 버튼
  // 한 번에 바로 실행됐고(옆의 "기각" 버튼만 AlertDialog로 확인을 받았다), 성공/실패
  // 피드백도 전혀 없었다 — 관리자가 실수로 눌러도 막을 방법이 없고, 실패해도 알 방법이
  // 없었다. 두 액션 다 실패 시 알림을 띄우게 한다.
  const handleApprove = async (bookingId: string) => {
    try {
      await resolveCancellationReview(bookingId, true);
      toast({ title: "강제 환불 승인을 처리했습니다." });
    } catch (err) {
      toast({
        title: "강제 환불 승인에 실패했습니다",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (bookingId: string) => {
    try {
      await resolveCancellationReview(bookingId, false, rejectReasonDrafts[bookingId]);
      toast({ title: "취소 신청을 기각했습니다." });
    } catch (err) {
      toast({
        title: "기각 처리에 실패했습니다",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      className="flex-1 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      중재 결정: 강제 환불 승인
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>강제 환불을 승인하시겠습니까?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {booking.diverName}님에게 결제 금액 전액이 즉시 환불되고, 담당 강사에게 정산 차감/보류
                        조치가 함께 적용됩니다. 이 작업은 되돌릴 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => void handleApprove(booking.id)}
                      >
                        강제 환불 승인
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="secondary" className="flex-1 gap-1 text-xs">
                      <XCircle className="h-3.5 w-3.5" />
                      중재 결정: 기각
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>이 취소 신청을 기각하시겠습니까?</AlertDialogTitle>
                      <AlertDialogDescription>
                        예약이 다시 확정 상태로 복구됩니다. 반려 사유를 입력하면 다이버에게 즉시 알림으로
                        전달됩니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                      placeholder="반려 사유를 입력하세요 (다이버에게 전달됩니다)"
                      value={rejectReasonDrafts[booking.id] ?? ""}
                      onChange={(e) =>
                        setRejectReasonDrafts((prev) => ({ ...prev, [booking.id]: e.target.value }))
                      }
                      className="text-xs"
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void handleReject(booking.id)}>
                        기각 확정
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
