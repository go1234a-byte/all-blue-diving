import { useState } from "react";
import { Flag, MessageSquareReply, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { formatDateKR } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface ReviewListProps {
  tourId: string;
}

/** 투어 상세페이지 - 후기 및 평점 목록 (평균 평점, 후기 개수, 사진 리뷰 포함). */
export function ReviewList({ tourId }: ReviewListProps) {
  const { getReviewsByTourId, reportReview } = useAppData();
  const { toast } = useToast();
  const [reportedIds, setReportedIds] = useState<string[]>([]);

  const reviews = getReviewsByTourId(tourId);

  if (reviews.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">후기 및 평점</h3>
        <p className="py-6 text-center text-sm text-muted-foreground">아직 등록된 후기가 없습니다.</p>
      </div>
    );
  }

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const allPhotos = reviews.flatMap((r) => r.photos);

  const handleReport = (reviewId: string) => {
    reportReview(reviewId);
    setReportedIds((prev) => [...prev, reviewId]);
    toast({ title: "후기가 신고 접수되었습니다" });
  };

  return (
    <div className="space-y-3">
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
              <img src={url} alt={`후기 사진 ${i + 1}`} crossOrigin="anonymous" className="h-full w-full object-cover" />
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
                disabled={reportedIds.includes(review.id) || review.reported}
                onClick={() => handleReport(review.id)}
              >
                <Flag className="h-3 w-3" />
                {review.reported || reportedIds.includes(review.id) ? "신고 접수됨" : "신고"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
