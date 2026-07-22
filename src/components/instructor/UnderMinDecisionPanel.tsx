import { useState } from "react";
import { AlertTriangle, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateKR } from "@/lib/dates";
import { toast } from "sonner";

interface UnderMinDecisionPanelProps {
  instructorId: string;
}

/**
 * 출발 30일 전 자동 마감 시점에 확정 예약 수가 최소 인원에 미달한 투어를 모아 보여주고,
 * 강사가 "그대로 진행" 또는 "취소(전액환불)"을 직접 선택하도록 하는 패널.
 * 강사 대시보드 상단에 노출되어 결정이 필요한 투어를 놓치지 않도록 한다.
 */
export function UnderMinDecisionPanel({ instructorId }: UnderMinDecisionPanelProps) {
  const { tours, bookings, resolveUnderMinDecision } = useAppData();
  const [processingTourId, setProcessingTourId] = useState<string | null>(null);
  const [cancelTargetTourId, setCancelTargetTourId] = useState<string | null>(null);

  const pendingTours = tours.filter((t) => t.instructorId === instructorId && t.underMinDecisionPending);

  if (pendingTours.length === 0) return null;

  const handleProceed = async (tourId: string, title: string) => {
    setProcessingTourId(tourId);
    try {
      await resolveUnderMinDecision(tourId, "proceed");
      toast.success(`"${title}" 투어를 예정대로 진행합니다.`);
    } finally {
      setProcessingTourId(null);
    }
  };

  const handleCancelConfirm = async (tourId: string, title: string) => {
    setProcessingTourId(tourId);
    try {
      await resolveUnderMinDecision(tourId, "cancel");
      toast.success(`"${title}" 투어를 취소했습니다. 확정 예약은 전액 환불 처리됩니다.`);
    } finally {
      setProcessingTourId(null);
      setCancelTargetTourId(null);
    }
  };

  return (
    <Card className="border-2 border-destructive bg-destructive/5">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
          <AlertTriangle className="h-4 w-4" />
          최소 인원 미달 - 결정이 필요한 투어 {pendingTours.length}건
        </div>
        <p className="break-keep text-xs text-muted-foreground">
          출발 30일 전 기준 확정 예약이 최소 인원에 미달해 모집이 마감되었습니다. 투어를 예정대로
          진행할지, 취소하고 확정 예약을 전액 환불할지 선택해주세요.
        </p>
        <div className="space-y-2">
          {pendingTours.map((tour) => {
            const confirmedCount = bookings.filter(
              (b) => b.tourId === tour.id && b.status === "confirmed",
            ).length;
            const isProcessing = processingTourId === tour.id;
            return (
              <div
                key={tour.id}
                className="space-y-2 rounded-lg border border-destructive/40 bg-background p-3"
              >
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-medium text-foreground">{tour.title}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    확정 {confirmedCount}명 / 최소 {tour.minParticipants}명 · 출발일{" "}
                    {formatDateKR(tour.startDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="h-8 flex-1 text-xs"
                    disabled={isProcessing}
                    onClick={() => void handleProceed(tour.id, tour.title)}
                  >
                    그대로 진행
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 flex-1 text-xs"
                    disabled={isProcessing}
                    onClick={() => setCancelTargetTourId(tour.id)}
                  >
                    투어 취소(전액환불)
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <AlertDialog open={cancelTargetTourId !== null} onOpenChange={(open) => !open && setCancelTargetTourId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>투어를 취소하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                취소를 확정하면 해당 투어의 확정 예약이 모두 취소되고 전액(100%) 환불 처리됩니다. 이
                작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>돌아가기</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  const tour = pendingTours.find((t) => t.id === cancelTargetTourId);
                  if (tour) void handleCancelConfirm(tour.id, tour.title);
                }}
              >
                취소 확정
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
