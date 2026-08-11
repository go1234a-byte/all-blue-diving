import { useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileDropzone } from "@/components/auth/FileDropzone";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { uploadImageFiles } from "@/lib/uploadImage";
import type { Tour } from "@/types";

interface TourCancelByInstructorCardProps {
  tour: Tour;
}

/**
 * 강사 본인 귀책이 아닌 사유(예: 샵 중복예약)로 확정 예약이 있는 투어를 취소해야 할 때,
 * 사유와 증빙(카톡 예약확인 캡처 등)을 함께 제출하는 카드. 투어 수정 화면 하단에 노출된다.
 *
 * 제출 즉시 확정 예약은 전액환불 처리되고 정산도 일반 취소와 동일하게 취소되지만(cancelBooking과
 * 동일한 즉시 처리), 관리자가 증빙을 검토해 승인하면 1차 정산(80%)만 정산 예정 상태로 복구된다.
 * 이미 접수된(반려되지 않은) 신청이 있으면 중복 제출을 막고 진행 상태를 안내한다.
 */
export function TourCancelByInstructorCard({ tour }: TourCancelByInstructorCardProps) {
  const { tourCancellationClaims, getConfirmedParticipantCount, cancelTourByInstructor } = useAppData();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const claimsForTour = tourCancellationClaims
    .filter((c) => c.tourId === tour.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const latestClaim = claimsForTour[0];
  const blockedByLatestClaim = latestClaim && latestClaim.status !== "rejected";

  const confirmedCount = getConfirmedParticipantCount(tour.id);

  const handleClose = (next: boolean) => {
    if (!next) {
      setReason("");
      setEvidenceFiles([]);
    }
    setOpen(next);
  };

  const handleSubmit = async () => {
    if (reason.trim().length < 5) {
      toast({ title: "취소 사유를 5자 이상 입력해주세요", variant: "destructive" });
      return;
    }
    if (evidenceFiles.length === 0) {
      toast({ title: "증빙 사진을 최소 1장 첨부해주세요", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const urls = await uploadImageFiles(evidenceFiles, `tour-cancellation-claims/${tour.id}`);
      await cancelTourByInstructor(tour.id, reason.trim(), urls);
      toast({
        title: "취소 및 증빙 제출이 완료되었습니다",
        description: "확정 예약은 전액 환불 처리되었습니다. 관리자 검토 후 1차 정산(80%) 지급 여부가 결정됩니다.",
      });
      handleClose(false);
    } catch (err) {
      toast({
        title: "취소 접수에 실패했습니다",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-destructive/30">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
          <Ban className="h-4 w-4" />
          투어 취소
        </div>
        <p className="break-keep text-xs text-muted-foreground">
          샵 중복예약 등 강사 귀책이 아닌 사유로 확정 예약을 취소해야 할 때 사용하세요. 사유와 증빙(예약
          확인 카톡 캡처 등)을 함께 제출하면, 확정 예약은 즉시 전액환불 처리되고 관리자 검토 후 1차
          정산(80%) 지급 여부가 결정됩니다.
        </p>

        {latestClaim && latestClaim.status === "pending" && (
          <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning-foreground">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="break-keep">취소 및 증빙 제출이 접수되어 관리자 검토를 기다리고 있습니다.</span>
          </div>
        )}
        {latestClaim && latestClaim.status === "approved" && (
          <div className="flex items-start gap-2 rounded-lg border border-success/40 bg-success/10 p-3 text-xs text-success-foreground">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="break-keep">
              증빙이 승인되어 1차 정산(80%)이 정산 예정 상태로 복구되었습니다.
              {latestClaim.adminNote ? ` (${latestClaim.adminNote})` : ""}
            </span>
          </div>
        )}
        {latestClaim && latestClaim.status === "rejected" && (
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="break-keep">
              이전 취소 신청이 반려되었습니다.{latestClaim.adminNote ? ` 사유: ${latestClaim.adminNote}` : ""}
            </span>
          </div>
        )}

        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          disabled={!!blockedByLatestClaim}
          onClick={() => setOpen(true)}
        >
          {blockedByLatestClaim ? "이미 취소 신청이 접수되었습니다" : "투어 취소 및 증빙 제출"}
        </Button>

        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="break-keep">투어 취소 및 증빙 제출</DialogTitle>
              <DialogDescription className="break-keep">{tour.title}</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning-foreground">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="break-keep">
                  제출 즉시 확정 예약 {confirmedCount}건이 전액환불 처리되며 되돌릴 수 없습니다. 관리자가
                  증빙을 반려하면 정산은 취소된 상태로 유지됩니다.
                </span>
              </div>

              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="예: 다이빙샵 중복예약으로 현지 이용이 불가능해졌습니다. 예약 확인 카톡을 첨부합니다."
                rows={4}
              />

              <FileDropzone
                label="📸 증빙 사진 첨부 (예약확인 카톡 캡처 등)"
                multiple
                maxFiles={5}
                accept="image/*"
                onFilesChange={setEvidenceFiles}
              />
            </div>

            <DialogFooter>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => void handleSubmit()}
                disabled={submitting}
              >
                취소 및 증빙 제출
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
