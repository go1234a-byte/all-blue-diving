import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { ChecklistSummaryCards } from "@/components/trip/ChecklistSummaryCards";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { useTripChecklist } from "@/hooks/useTripChecklist";
import { buildPackingTemplate, daysUntil, EMPTY_CHECKLIST_STATE, mergeChecklist } from "@/lib/packingChecklist";

/**
 * 준비물 요약을 참가자 화면에 붙이는 진입점. 확정 예약자가 아니면 아무것도 그리지 않는다.
 * full = 참가자 대시보드 탭용 요약 카드, compact = 예약 내역 카드 한 줄.
 */
export function TripChecklistSummary({ tourId, variant }: { tourId: string; variant: "full" | "compact" }) {
  const { currentDiverId } = useRole();
  const { getTourById, bookings } = useAppData();
  const tour = getTourById(tourId);
  const booking = bookings.find(
    (b) => b.tourId === tourId && b.diverId === currentDiverId && b.status === "confirmed",
  );
  const enabled = !!booking && !tour?.cancelledAt;
  const { items, state } = useTripChecklist(tourId, currentDiverId, enabled);

  if (!enabled || !tour) return null;
  if (items.isPending || state.isPending) {
    return variant === "compact" ? null : <div className="h-24 animate-pulse rounded-xl bg-secondary/60" />;
  }

  const merged = mergeChecklist(
    buildPackingTemplate(tour.activityTypes),
    items.data ?? [],
    state.data ?? EMPTY_CHECKLIST_STATE,
  );
  const link = `/trip/${tour.id}/checklist`;

  if (variant === "compact") {
    return (
      <Link
        to={link}
        className="flex min-h-11 items-center justify-between gap-2 rounded-lg px-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <span>
          준비 {merged.progress.done}/{merged.progress.total}
          {merged.progress.requiredLeft > 0 && (
            <span className="font-semibold text-[hsl(32_95%_32%)] dark:text-[hsl(38_95%_68%)]">
              {" "}· 필수 {merged.progress.requiredLeft}개 남음
            </span>
          )}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0" />
      </Link>
    );
  }

  return (
    <section className="space-y-3">
      <ChecklistSummaryCards dDay={daysUntil(tour.startDate)} progress={merged.progress} />
      <Link
        to={link}
        className="flex min-h-11 items-center justify-between rounded-xl border border-border bg-card px-4 text-[15px] font-semibold text-foreground transition-colors hover:bg-secondary/60"
      >
        준비물 체크하기
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </Link>
    </section>
  );
}
