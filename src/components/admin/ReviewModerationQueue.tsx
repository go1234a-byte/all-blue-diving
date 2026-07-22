import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateKR } from "@/lib/dates";

/** 관리자용 신고된 후기 관리 큐. 신고된(reported) 후기를 나열하고 소프트 삭제(deleted)할 수 있다. */
export function ReviewModerationQueue() {
  const { reviews, deleteReview } = useAppData();
  const reportedReviews = reviews.filter((r) => r.reported && !r.deleted);

  if (reportedReviews.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">신고된 후기가 없습니다.</p>;
  }

  return (
    <div className="space-y-2">
      {reportedReviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="space-y-1.5 p-3">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="destructive" className="text-[10px]">신고 접수됨</Badge>
              <span className="text-[10px] text-muted-foreground">{formatDateKR(review.createdAt)}</span>
            </div>
            {review.title && <p className="text-sm font-medium text-foreground">{review.title}</p>}
            <p className="line-clamp-2 text-xs text-muted-foreground">{review.comment}</p>
            <Button size="sm" variant="destructive" onClick={() => deleteReview(review.id)}>
              후기 삭제
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
