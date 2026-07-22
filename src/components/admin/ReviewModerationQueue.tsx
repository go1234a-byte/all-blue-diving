import { useState } from "react";
import { ChevronDown, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateKR } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Review } from "@/types";

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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">후기 삭제</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>이 후기를 삭제하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    삭제된 후기는 다이버/강사 화면에서 더 이상 노출되지 않습니다. 이 작업은 되돌릴 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteReview(review.id)}>삭제</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * 관리자 전용 — 신고 여부와 무관하게 등록된 모든 후기를 나열하고, 후기를 클릭하면 펼쳐져
 * 상세 내용을 확인한 뒤 삭제할 수 있다. (관리자만 접근 가능한 /admin/reports 라우트에서만 렌더링됨)
 */
export function AllReviewsAdminPanel() {
  const { reviews, deleteReview, getTourById } = useAppData();
  const [openId, setOpenId] = useState<string | null>(null);
  const allReviews = reviews.filter((r: Review) => !r.deleted);

  if (allReviews.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">등록된 후기가 없습니다.</p>;
  }

  return (
    <div className="space-y-2">
      {allReviews.map((review) => {
        const tour = getTourById(review.tourId);
        const isOpen = openId === review.id;
        return (
          <Card key={review.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 p-3 text-left"
              onClick={() => setOpenId(isOpen ? null : review.id)}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5">
                  {review.reported && (
                    <Badge variant="destructive" className="text-[10px]">신고됨</Badge>
                  )}
                  <p className="line-clamp-1 text-xs font-medium text-foreground">{tour?.title ?? "투어"}</p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn("h-3 w-3", star <= review.rating ? "text-warning" : "text-muted-foreground")}
                    />
                  ))}
                  <span className="ml-1 text-[10px] text-muted-foreground">{formatDateKR(review.createdAt)}</span>
                </div>
              </div>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
              <CardContent className="space-y-2 border-t border-border p-3 pt-2">
                {review.title && <p className="text-sm font-medium text-foreground">{review.title}</p>}
                <p className="whitespace-pre-wrap text-xs text-muted-foreground">{review.comment}</p>
                {review.instructorReply && (
                  <div className="rounded-lg border border-border bg-secondary/40 p-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">강사 답글: </span>
                    {review.instructorReply}
                  </div>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">후기 삭제</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>이 후기를 삭제하시겠습니까?</AlertDialogTitle>
                      <AlertDialogDescription>
                        삭제된 후기는 다이버/강사 화면에서 더 이상 노출되지 않습니다. 이 작업은 되돌릴 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteReview(review.id)}>삭제</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
