import { useState } from "react";
import { Flag, Lock, MessageSquareReply, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { formatDateKR } from "@/lib/dates";
import { handleImageFallback, IMAGE_PLACEHOLDER } from "@/lib/image";
import { cn } from "@/lib/utils";

interface ReviewListProps {
  tourId: string;
}

/**
 * 투어 상세페이지 - 후기 및 평점 목록 (평균 평점, 후기 개수, 사진 리뷰 포함).
 * "강사/관리자만 공개" 후기는 일반 사용자(비회원/다이버)에게는 숨기고,
 * 해당 투어의 담당 강사 본인과 관리자에게만 노출한다.
 */
export function ReviewList({ tourId }: ReviewListProps) {
  const { getReviewsByTourId, getTourById, reportReview } = useAppData();
  const { role, currentInstructorId } = useRole();
  const { toast } = useToast();
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [reportingId, setReportingId] = useState<string | null>(null);

  const tour = getTourById(tourId);
  const isPrivilegedViewer =
    role === "admin" || (role === "instructor" && !!currentInstructorId && currentInstructorId === tour?.instructorId);
  const reviews = getReviewsByTourId(tourId).filter(
    (r) => r.visibility !== "instructor_only" || isPrivilegedViewer,
  );

  if (reviews.length === 0) {
    return (
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">후기 및 평점</h3>
        <p className="py-6 text-center text-sm text-muted-foreground">아직 등록된 후기가 없습니다.</p>
      </div>
    );
  }

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const allPhotos = reviews.flatMap((r) => r.photos);

  const handleReport = async (reviewId: string) => {
    setReportingId(reviewId);
    try {
      await reportReview(reviewId);
      setReportedIds((prev) => [...prev, reviewId]);
      toast({ title: "후기가 신고 접수되었습니다" });
    } catch (err) {
      // reportReview가 실패 시 에러를 던지도록 바뀌었다 — 예전에는 결과를 기다리지도
      // 않고(await 없이 fire-and-forget) 항상 성공 토스트만 띄워서, 실제로는 신고가
      // 저장되지 않았는데도 사용자에게는 접수된 것처럼 보이는 문제가 있었다.
      toast({
        title: "신고 접수에 실패했습니다",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setReportingId(null);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">후기 및 평점</h3>
        <div className="flex items-center gap-1 text-sm">
          <Star className="h-4 w-4 text-warning" />
          <span className="font-bold text-foreground">{averageRating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({reviews.length}개 후기)</span>
        </div>
      </div>

      {allPhotos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allPhotos.slice(0, 10).map((url, i) => (
            <div key={url + i} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border">
              <img src={url || IMAGE_PLACEHOLDER} alt={`후기 사진 ${i + 1}`} onError={handleImageFallback} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="space-y-1.5 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-3.5 w-3.5",
                        star <= review.rating ? "text-warning" : "text-muted-foreground",
                      )}
                    />
                  ))}
                  {review.visibility === "instructor_only" && (
                    <Badge variant="outline" className="ml-1 gap-1 px-1.5 py-0 text-[9px]">
                      <Lock className="h-2.5 w-2.5" />
                      강사/관리자 전용
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">{formatDateKR(review.createdAt)}</span>
              </div>
              {review.title && <p className="text-sm font-semibold text-foreground">{review.title}</p>}
              {review.comment && <p className="text-xs text-muted-foreground">{review.comment}</p>}
              {review.instructorReply && (
                <div className="ml-2 space-y-0.5 rounded-lg border-l-2 border-primary/50 bg-secondary/40 p-2">
                  <p className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <MessageSquareReply className="h-3 w-3" />
                    강사 답글
                  </p>
                  <p className="break-keep text-xs text-foreground">{review.instructorReply}</p>
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-1.5 text-[10px] text-muted-foreground"
                disabled={reportedIds.includes(review.id) || review.reported || reportingId === review.id}
                onClick={() => handleReport(review.id)}
              >
                <Flag className="h-3 w-3" />
                {review.reported || reportedIds.includes(review.id)
                  ? "신고 접수됨"
                  : reportingId === review.id
                    ? "접수 중..."
                    : "신고"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
