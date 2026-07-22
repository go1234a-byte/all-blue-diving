import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateRangeKR } from "@/lib/dates";
import { formatKRW } from "@/lib/pricing";
import { CERTIFICATION_LABELS } from "@/lib/constants";

/** 모바일 폭에 맞춘 카드형 투어 목록 — 기존 데스크톱 표 대신 사용한다. */
const AdminToursPage = () => {
  const { tours, getInstructorById, bookings } = useAppData();

  return (
    <div className="space-y-2">
      {tours.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">등록된 투어가 없습니다.</p>
      )}
      {tours.map((tour) => {
        const instructor = getInstructorById(tour.instructorId);
        const participantCount = bookings.filter(
          (b) => b.tourId === tour.id && b.status === "confirmed",
        ).length;
        return (
          <div key={tour.id} className="space-y-1.5 rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-1 text-sm font-semibold text-foreground">{tour.title}</p>
              <Badge variant={tour.status === "open" ? "default" : "secondary"} className="shrink-0 text-[10px]">
                {tour.status === "open" ? "모집중" : "마감"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {tour.country} · {tour.site} · {formatDateRangeKR(tour.startDate, tour.endDate)}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <span>담당 {instructor?.name ?? "-"}</span>
              <span>{CERTIFICATION_LABELS[tour.certificationLevel]}</span>
              <span>
                {participantCount}/{tour.maxParticipants}명
              </span>
            </div>
            <p className="text-sm font-semibold text-primary">{formatKRW(tour.basePrice)}</p>
          </div>
        );
      })}
    </div>
  );
};

export default AdminToursPage;
