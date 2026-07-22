import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileDropzone } from "@/components/auth/FileDropzone";
import { CategoryStarRow } from "@/components/mypage/CategoryStarRow";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ReviewCategoryRatings } from "@/types";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tourId: string;
  bookingId: string;
  diverId: string;
}

const DEFAULT_CATEGORY_RATINGS: ReviewCategoryRatings = {
  instructorKindness: 0,
  instructorExpertise: 0,
  instructorSafety: 0,
  centerFacility: 0,
  centerCleanliness: 0,
  centerLocation: 0,
  tourSatisfaction: 0,
  tourSchedule: 0,
  tourValue: 0,
};

export function ReviewDialog({ open, onOpenChange, tourId, bookingId, diverId }: ReviewDialogProps) {
  const { addReview, getTourById } = useAppData();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [categoryRatings, setCategoryRatings] = useState<ReviewCategoryRatings>(DEFAULT_CATEGORY_RATINGS);
  const [photos, setPhotos] = useState<File[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tour = getTourById(tourId);

  const setCategoryRating = (key: keyof ReviewCategoryRatings, value: number) => {
    setCategoryRatings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: "별점을 선택해주세요", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await addReview({
        tourId,
        bookingId,
        diverId,
        instructorId: tour?.instructorId,
        rating,
        title: title.trim() || undefined,
        comment,
        categoryRatings,
        photos: photos.map((f) => URL.createObjectURL(f)),
        videoUrl: videoUrl.trim() || undefined,
      });
      toast({ title: "투어 평가가 등록되었습니다. 감사합니다!" });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>투어는 어떠셨나요?</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center gap-1 py-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`${star}점`}
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  star <= (hoverRating || rating)
                    ? "text-warning"
                    : "text-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>

        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="후기 제목 (선택)" />

        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="투어 후기를 남겨주세요 (선택)"
        />

        <div className="space-y-3 rounded-xl border border-border p-3">
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">강사</p>
            <CategoryStarRow label="친절도" value={categoryRatings.instructorKindness} onChange={(v) => setCategoryRating("instructorKindness", v)} />
            <CategoryStarRow label="전문성" value={categoryRatings.instructorExpertise} onChange={(v) => setCategoryRating("instructorExpertise", v)} />
            <CategoryStarRow label="안전관리" value={categoryRatings.instructorSafety} onChange={(v) => setCategoryRating("instructorSafety", v)} />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">센터</p>
            <CategoryStarRow label="시설" value={categoryRatings.centerFacility} onChange={(v) => setCategoryRating("centerFacility", v)} />
            <CategoryStarRow label="청결" value={categoryRatings.centerCleanliness} onChange={(v) => setCategoryRating("centerCleanliness", v)} />
            <CategoryStarRow label="위치" value={categoryRatings.centerLocation} onChange={(v) => setCategoryRating("centerLocation", v)} />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">투어</p>
            <CategoryStarRow label="만족도" value={categoryRatings.tourSatisfaction} onChange={(v) => setCategoryRating("tourSatisfaction", v)} />
            <CategoryStarRow label="일정" value={categoryRatings.tourSchedule} onChange={(v) => setCategoryRating("tourSchedule", v)} />
            <CategoryStarRow label="가성비" value={categoryRatings.tourValue} onChange={(v) => setCategoryRating("tourValue", v)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-foreground">사진 업로드 (최대 10장, 선택)</p>
          <FileDropzone label="후기 사진 업로드" multiple maxFiles={10} accept="image/*" onFilesChange={setPhotos} />
        </div>

        <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="동영상 URL (선택)" />

        <p className="break-keep text-[11px] leading-relaxed text-muted-foreground">
          실제 참가자만 작성 가능 · 허위 후기 금지 · 욕설 및 비방 금지 · 광고 금지
        </p>

        <DialogFooter>
          <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
            평가 등록하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
