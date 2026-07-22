import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDropzone } from "@/components/auth/FileDropzone";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import {
  computeDaysRemaining,
  computeRefundRate,
  computeRefundAmount,
  requiresAdminReview,
  INSTRUCTOR_DISPUTE_REASON,
} from "@/lib/refund";
import { formatKRW } from "@/lib/pricing";
import { CANCEL_REASONS } from "@/types";
import type { Booking, Tour } from "@/types";

interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking;
  tour: Tour;
}

/**
 * 마이페이지 > 내 예약 내역 > "예약 취소하기" 트리거.
 * 사유 선택 → 날짜 자동 계산 환불율 산출 → 확인 요약 → 즉시 취소 처리,
 * 단 출발 7일 미만 + 불가피한 사유 선택 시 증빙서류 업로드 → 운영팀 심사 경로로 전환한다.
 */
export function CancelBookingDialog({ open, onOpenChange, booking, tour }: CancelBookingDialogProps) {
  const { cancelBooking, submitCancellationForReview } = useAppData();
  const { toast } = useToast();
  const [reason, setReason] = useState<string>(CANCEL_REASONS[0]);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const daysRemaining = computeDaysRemaining(tour.startDate);
  const refundRate = computeRefundRate(tour);
  const refundAmount = computeRefundAmount(booking.totalPaid, refundRate);
  const needsAdminReview = requiresAdminReview(tour, reason);
  const isDispute = reason === INSTRUCTOR_DISPUTE_REASON;

  const handleClose = (next: boolean) => {
    if (!next) {
      setReason(CANCEL_REASONS[0]);
      setEvidenceFiles([]);
    }
    onOpenChange(next);
  };

  const handleConfirmCancel = async () => {
    setSubmitting(true);
    try {
      const result = await cancelBooking(booking.id, reason);
      toast({
        title: "예약이 취소되었습니다",
        description: `총 결제 금액의 ${Math.round(result.refundRate * 100)}%(${formatKRW(result.refundAmount)})가 환불 처리됩니다.`,
      });
      handleClose(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (evidenceFiles.length === 0) {
      toast({ title: "증빙서류를 업로드해주세요", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await submitCancellationForReview(booking.id, reason, evidenceFiles.map((f) => f.name));
      toast({
        title: "취소 요청이 접수되었습니다",
        description: "운영팀 심사 후 환불 여부가 결정됩니다. (심사 대기)",
      });
      handleClose(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="break-keep">예약 취소하기</DialogTitle>
          <DialogDescription className="break-keep">{tour.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CANCEL_REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {needsAdminReview ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning-foreground">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="break-keep">
                  {isDispute
                    ? "강사/투어사 귀책 사유는 운영팀 심사가 필요합니다. 이의신청 증빙 자료를 첨부해주세요."
                    : `출발 ${Math.abs(daysRemaining)}일 ${daysRemaining >= 0 ? "전" : "경과"}으로 자동 환불 대상이 아닙니다. 증빙서류 제출 후 운영팀 심사에 따라 환불 여부가 결정됩니다.`}
                </span>
              </div>
              <FileDropzone
                label={
                  isDispute
                    ? "📸 이의신청 및 증빙용 사진 파일 첨부 (병원 진단서, 현지 환경 사진 등)"
                    : "📄 증빙서류 제출 (의사 진단서 또는 기상 악화 증빙 자료를 업로드하세요)"
                }
                multiple
                maxFiles={5}
                accept=".pdf,.jpg,.png"
                onFilesChange={setEvidenceFiles}
              />
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border border-primary/30 bg-secondary/40 p-3">
              <p className="break-keep text-sm leading-relaxed text-foreground">
                인입된 취소 요청 분석 결과, 출발 {daysRemaining}일 전으로 총 결제 금액의{" "}
                <span className="font-bold text-primary">{Math.round(refundRate * 100)}%</span>가 환불
                계좌/카드로 처리됩니다. 진행하시겠습니까?
              </p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                예상 환불 금액: <span className="font-semibold text-primary">{formatKRW(refundAmount)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {needsAdminReview ? (
            <Button className="w-full" onClick={handleSubmitReview} disabled={submitting}>
              증빙자료 제출 및 심사 요청
            </Button>
          ) : (
            <Button variant="destructive" className="w-full" onClick={handleConfirmCancel} disabled={submitting}>
              취소 및 환불 진행하기
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
