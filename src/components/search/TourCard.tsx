import { Link } from "react-router-dom";
import { Bookmark, Star, Users } from "lucide-react";
import type { Tour } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/tour/VerifiedBadge";
import { InstructorMiniScoreboard } from "@/components/tour/InstructorMiniScoreboard";
import { useAppData } from "@/contexts/AppDataContext";
import { formatKRW } from "@/lib/pricing";
import { formatDateRangeKR } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { handleImageFallback, IMAGE_PLACEHOLDER } from "@/lib/image";

interface TourCardProps {
  tour: Tour;
}

const ACTIVITY_LABEL: Record<string, string> = {
  scuba: "스쿠버다이빙",
  freediving: "프리다이빙",
  liveaboard: "리브어보드",
};

export function TourCard({ tour }: TourCardProps) {
  const { getInstructorById, isBookmarked, toggleBookmark, bookings } = useAppData();
  const instructor = getInstructorById(tour.instructorId);
  const bookmarked = isBookmarked(tour.id);
  const confirmedCount = bookings.filter((b) => b.tourId === tour.id && b.status === "confirmed").length;

  return (
    <Link to={`/tour/${tour.id}`}>
      <Card className="accent-top-ocean group overflow-hidden border-border transition-shadow hover:shadow-ocean">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <img
            src={tour.mainImageUrl || IMAGE_PLACEHOLDER}
            alt={tour.title}
            onError={handleImageFallback}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {tour.activityTypes.map((type) => (
              <Badge key={type} className="bg-primary/90 text-primary-foreground backdrop-blur">
                {ACTIVITY_LABEL[type]}
              </Badge>
            ))}
            {tour.minLogCount != null && tour.minLogCount > 0 && (
              <Badge variant="outline" className="border-none bg-background/85 text-foreground backdrop-blur">
                로그수 {tour.minLogCount}회 이상
              </Badge>
            )}
          </div>
          <div className="absolute right-2 top-2 flex items-center gap-1.5">
            <div className="flex items-center gap-1 rounded-full bg-background/85 px-2 py-1 text-xs font-semibold text-foreground backdrop-blur">
              <Star className="h-3 w-3 text-warning" />
              {tour.rating.toFixed(1)}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                toggleBookmark(tour.id);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-background/85 backdrop-blur"
              aria-label="찜하기"
            >
              <Bookmark
                className={cn("h-3.5 w-3.5", bookmarked ? "fill-primary text-primary" : "text-foreground")}
              />
            </button>
          </div>
        </div>
        <CardContent className="space-y-3 p-4">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              {tour.country} · {tour.site}
            </div>
            <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{tour.title}</h3>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-foreground">
                {formatDateRangeKR(tour.startDate, tour.endDate)}
              </span>
              <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <Users className="h-3 w-3" />
                {confirmedCount}/{tour.maxParticipants}명
              </span>
            </div>
          </div>

          {instructor && (
            <div className="space-y-2 rounded-xl border border-border bg-secondary/50 p-2.5">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 shrink-0 border border-border">
                  <AvatarImage src={instructor.avatarUrl} alt={instructor.name} />
                  <AvatarFallback className="bg-primary text-[11px] text-primary-foreground">
                    {instructor.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="truncate text-xs font-semibold text-foreground">
                      {instructor.name} 강사
                    </span>
                    {instructor.agency && (
                      <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[9px]">
                        {instructor.agency}
                      </Badge>
                    )}
                  </div>
                  {instructor.verified && <VerifiedBadge className="mt-0.5" />}
                </div>
              </div>
              <InstructorMiniScoreboard instructor={instructor} />
            </div>
          )}

          <div className="pt-0.5 text-base font-bold text-primary">{formatKRW(tour.basePrice)}~</div>
        </CardContent>
      </Card>
    </Link>
  );
}
