import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { Tour } from "@/types";
import { useAppData } from "@/contexts/AppDataContext";
import { useSampleLock } from "@/hooks/useSampleLock";
import { applyPlatformFee, formatKRW } from "@/lib/pricing";
import { formatDateRangeKR, formatNightsDaysKR } from "@/lib/dates";
import { handleImageFallback, IMAGE_PLACEHOLDER } from "@/lib/image";
import { ACTIVITY_LABEL } from "@/lib/activityBadge";
import { isDepartureConfirmed } from "@/lib/tourLabels";
import { computeDaysRemaining } from "@/lib/refund";
import { dDayLabel, ratingText, seatState, seatsLeft } from "@/lib/tourDisplay";
import { AdminHeadcountControl } from "@/components/tour/AdminHeadcountControl";

/** 모바일 검색 목록용 압축 카드: 상태 라벨 1~2개 · 제목 · 기간/강사 · 별점+후기 수 · 가격. (데스크톱은 기존 TourCard) */
export function TourCardCompact({ tour }: { tour: Tour }) {
  const { getConfirmedParticipantCount, getInstructorById, getReviewsByTourId } = useAppData();
  const isLockedSample = useSampleLock();
  const joined = getConfirmedParticipantCount(tour.id);
  const instructor = getInstructorById(tour.instructorId);
  const rating = ratingText(getReviewsByTourId(tour.id).map((r) => r.rating));
  const state = seatState(tour, joined);
  const confirmed = isDepartureConfirmed(tour, joined);
  const dday = dDayLabel(computeDaysRemaining(tour.startDate));

  return (
    <Link to={`/tour/${tour.id}`} className="flex gap-3 rounded-2xl border border-border/60 bg-card p-2.5 shadow-sm">
      <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-xl">
        <img src={tour.mainImageUrl || IMAGE_PLACEHOLDER} alt={tour.title} onError={handleImageFallback} className="h-full w-full object-cover" />
        {dday && <span className="absolute left-1.5 top-1.5 rounded-md bg-foreground/90 px-1.5 py-0.5 text-[11px] font-bold text-background">{dday}</span>}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap gap-1">
          {isLockedSample(tour.title) && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-900">예시 투어</span>}
          {state === "full" && <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-bold">모집마감</span>}
          {state === "few" && <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[11px] font-bold text-destructive">{seatsLeft(tour, joined)}자리 남음</span>}
          {confirmed && state !== "few" && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-800">출발확정</span>}
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary">{ACTIVITY_LABEL[tour.activityTypes[0]] ?? ""}</span>
        </div>
        <h3 className="line-clamp-2 text-[14.5px] font-semibold leading-snug text-foreground">{tour.title}</h3>
        <p className="text-xs text-muted-foreground">
          {formatDateRangeKR(tour.startDate, tour.endDate)} · {formatNightsDaysKR(tour.startDate, tour.endDate)}
          {instructor?.verified ? " · 인증강사" : ""}
        </p>
        <p className="flex items-center gap-1 text-xs">
          {rating ? (
            <>
              <Star className="h-3 w-3 fill-warning text-warning" />
              <span className="font-semibold">{rating.avg}</span>
              <span className="text-muted-foreground">(후기 {rating.count})</span>
            </>
          ) : (
            <span className="text-muted-foreground">후기 준비 중</span>
          )}
        </p>
        <p className="text-base font-extrabold text-primary">{formatKRW(applyPlatformFee(tour.basePrice))}~</p>
        <AdminHeadcountControl tour={tour} className="pt-0.5" />
      </div>
    </Link>
  );
}
