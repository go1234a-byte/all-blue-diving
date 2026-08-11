import { useState } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { formatDateTimeKR } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { TourCancellationClaimStatus } from "@/types";

const STATUS_LABEL: Record<TourCancellationClaimStatus, string> = {
  pending: "검토 대기",
  approved: "승인됨",
  rejected: "반려됨",
};

/**
 * 관리자용 — 강사가 샵 중복예약 등 본인 귀책이 아닌 사유로 확정 투어를 취소하며 제출한
 * 증빙(tour_cancellation_claims)을 검토하는 큐. 승인하면 관련 정산의 1차 정산(80%)이
 * 정산 예정 상태로 복구되고 2차 정산(20%)은 투어가 진행되지 않았으므로 0원 처리된다.
 * 반려하면 정산은 취소된 상태로 유지된다.
 */
const AdminTourCancellationClaimsPage = () => {
  const { tourCancellationClaims, getTourById, getInstructorById, reviewTourCancellationClaim, adminProfile } =
    useAppData();
  const { toast } = useToast();
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const sorted = [...tourCancellationClaims].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleReview = async (claimId: string, approved: boolean) => {
    setProcessingId(claimId);
    try {
      await reviewTourCancellationClaim(claimId, approved, noteDrafts[claimId]?.trim() ?? "", adminProfile.name);
      toast({
        title: approved ? "증빙을 승인했습니다" : "증빙을 반려했습니다",
        description: approved
          ? "1차 정산(80%)이 정산 예정 상태로 복구되었습니다."
          : "정산은 취소된 상태로 유지됩니다.",
      });
    } catch (err) {
      toast({
        title: "처리에 실패했습니다",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-foreground">투어 취소 증빙 검토</h1>
        <p className="mt-1 break-keep text-xs text-muted-foreground">
          강사가 샵 중복예약 등 본인 귀책이 아닌 사유로 확정 투어를 취소하며 제출한 증빙입니다. 승인하면
          1차 정산(80%)이 정산 예정 상태로 복구되고, 2차 정산(20%)은 투어가 진행되지 않았으므로 0원
          처리됩니다.
        </p>
      </div>

      {sorted.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">접수된 취소 증빙 신청이 없습니다.</p>
      )}

      <div className="space-y-3">
        {sorted.map((claim) => {
          const tour = getTourById(claim.tourId);
          const instructor = getInstructorById(claim.instructorId);
          const isPending = claim.status === "pending";
          const isProcessing = processingId === claim.id;

          return (
            <Card key={claim.id} className={cn(isPending ? "border-warning/40" : "border-border")}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">
                      {tour?.title ?? "알 수 없는 투어"}
                    </p>
                    <p className="break-keep text-xs text-muted-foreground">
                      강사: {instructor?.name ?? claim.instructorId} · 확정 예약{" "}
                      {claim.affectedBookingIds.length}건 · {formatDateTimeKR(claim.createdAt)}
                    </p>
                  </div>
                  <Badge
                    variant={isPending ? "secondary" : claim.status === "approved" ? "default" : "destructive"}
                    className="shrink-0 gap-1 text-[10px]"
                  >
                    {isPending && <Clock className="h-3 w-3" />}
                    {claim.status === "approved" && <CheckCircle2 className="h-3 w-3" />}
                    {claim.status === "rejected" && <XCircle className="h-3 w-3" />}
                    {STATUS_LABEL[claim.status]}
                  </Badge>
                </div>

                <div className="space-y-1 rounded-lg bg-secondary/50 p-2 text-xs text-muted-foreground">
                  <p className="break-keep font-semibold text-foreground">취소 사유</p>
                  <p className="break-keep">{claim.reason}</p>
                </div>

                {claim.evidenceFileUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                    {claim.evidenceFileUrls.map((url, idx) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-lg border border-border"
                      >
                        <img src={url} alt={`증빙 ${idx + 1}`} className="aspect-square w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                {!isPending && claim.adminNote && (
                  <p className="break-keep text-xs text-muted-foreground">
                    검토 메모: {claim.adminNote}
                    {claim.reviewedBy ? ` (${claim.reviewedBy})` : ""}
                  </p>
                )}

                {isPending && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="검토 메모 (선택, 강사에게 안내로 전달됩니다)"
                      value={noteDrafts[claim.id] ?? ""}
                      onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [claim.id]: e.target.value }))}
                      className="text-xs"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            className="flex-1 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                            disabled={isProcessing}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            승인 (1차 정산 복구)
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>증빙을 승인하시겠습니까?</AlertDialogTitle>
                            <AlertDialogDescription className="break-keep">
                              확정 예약 {claim.affectedBookingIds.length}건의 1차 정산(80%)이 정산 예정
                              상태로 복구됩니다. 2차 정산(20%)은 투어가 진행되지 않았으므로 0원 처리됩니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void handleReview(claim.id, true)}>
                              승인 확정
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="secondary" className="flex-1 gap-1 text-xs" disabled={isProcessing}>
                            <XCircle className="h-3.5 w-3.5" />
                            반려
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>증빙을 반려하시겠습니까?</AlertDialogTitle>
                            <AlertDialogDescription className="break-keep">
                              정산은 취소된 상태로 유지되며, 입력한 검토 메모가 강사에게 안내로 전달됩니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void handleReview(claim.id, false)}>
                              반려 확정
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTourCancellationClaimsPage;
