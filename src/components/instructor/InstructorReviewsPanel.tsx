import { useState } from "react";
import { MessageSquareReply, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { formatDateKR } from "@/lib/dates";
import { handleImageFallback, IMAGE_PLACEHOLDER } from "@/lib/image";
import { cn } from "@/lib/utils";

/** 후기에 첨부된 사진(다이버가 올린 증빙/후기 사진)을 강사가 확인할 수 있는 썸네일 그리드.
 *  예전에는 강사가 받은 후기 화면에 review.photos가 전혀 렌더링되지 않아, 다이버가 올린
 *  사진을 강사가 볼 수 없었다(관리자 쪽도 동일한 문제 — ReviewModerationQueue.tsx도 같이 수정). */
function ReviewPhotoThumbnails({ photos }: { photos?: string[] }) {
  if (!photos || photos.length === 0) return null;
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5">
      {photos.map((url, i) => (
        <a
          key={url + i}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border"
        >
          <img
            src={url || IMAGE_PLACEHOLDER}
            alt={`첨부 사진 ${i + 1}`}
            onError={handleImageFallback}
            className="h-full w-full object-cover"
          />
        </a>
      ))}
    </div>
  );
}

interface InstructorReviewsPanelProps {
  instructorId: string;
}

/** 강사 전용 — 담당 투어에 달린 후기 목록 + 답글 작성/수정. */
export function InstructorReviewsPanel({ instructorId }: InstructorReviewsPanelProps) {
  const { getReviewsByInstructorId, getTourById, replyToReview } = useAppData();
  const { toast } = useToast();
  const reviews = getReviewsByInstructorId(instructorId);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  if (reviews.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">아직 등록된 후기가 없습니다.</p>;
  }

  const handleSubmit = async (reviewId: string) => {
    const reply = (drafts[reviewId] ?? "").trim();
    if (!reply) {
      toast({ title: "답글 내용을 입력해주세요", variant: "destructive" });
      return;
    }
    setSubmittingId(reviewId);
    try {
      await replyToReview(reviewId, reply);
      toast({ title: "답글이 등록되었습니다" });
    } catch (err) {
      toast({
        title: "답글 저장에 실패했습니다",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">받은 후기 ({reviews.length}개)</h3>
      {reviews.map((review) => {
        const tour = getTourById(review.tourId);
        const draft = drafts[review.id] ?? review.instructorReply ?? "";
        return (
          <Card key={review.id}>
            <CardContent className="space-y-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="line-clamp-1 text-xs font-semibold text-foreground">{tour?.title ?? "투어"}</p>
                <span className="shrink-0 text-[10px] text-muted-foreground">{formatDateKR(review.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn("h-3.5 w-3.5", star <= review.rating ? "text-warning" : "text-muted-foreground")}
                  />
                ))}
              </div>
              {review.title && <p className="text-sm font-semibold text-foreground">{review.title}</p>}
              {review.comment && <p className="text-xs text-muted-foreground">{review.comment}</p>}
              <ReviewPhotoThumbnails photos={review.photos} />

              <div className="space-y-1.5 rounded-lg border border-primary/30 bg-secondary/30 p-2.5">
                <p className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <MessageSquareReply className="h-3 w-3" />
                  {review.instructorReply ? "답글 수정" : "답글 작성"}
                </p>
                <Textarea
                  value={draft}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))}
                  placeholder="다이버에게 남길 답글을 작성해주세요"
                  className="min-h-16 text-sm"
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={submittingId === review.id}
                    onClick={() => handleSubmit(review.id)}
                  >
                    {submittingId === review.id ? "저장 중..." : review.instructorReply ? "답글 수정" : "답글 등록"}
                  </Button>
                </div>
                {review.instructorReplyAt && (
                  <p className="text-right text-[10px] text-muted-foreground">
                    {formatDateKR(review.instructorReplyAt)}에 답글 작성됨
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
