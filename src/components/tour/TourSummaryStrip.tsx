import { CalendarDays, CircleCheck, CircleDashed, RotateCcw, Users } from "lucide-react";
import type { Tour } from "@/types";
import { tourTotalDays } from "@/lib/tourLabels";
import { computeDaysRemaining, refundSummary } from "@/lib/refund";
import { seatsLeft } from "@/lib/tourDisplay";
import { formatNightsDaysKR } from "@/lib/dates";

interface Props {
  tour: Pick<Tour, "startDate" | "endDate" | "maxParticipants">;
  joined: number;
  departureConfirmed: boolean;
}

/** 상세 첫 화면 핵심 요약 4칸 — 기간 · 정원/남은 자리 · 출발 확정 여부 · 지금 취소 시 환불. 값은 모두 실제 데이터/규정에서 계산한다. */
export function TourSummaryStrip({ tour, joined, departureConfirmed }: Props) {
  const left = seatsLeft(tour, joined);
  const refund = refundSummary(computeDaysRemaining(tour.startDate));
  const items = [
    { icon: CalendarDays, label: "기간", value: tourTotalDays(tour) <= 1 ? "당일" : formatNightsDaysKR(tour.startDate, tour.endDate), sub: "" },
    { icon: Users, label: "정원", value: `${tour.maxParticipants}명`, sub: left === 0 ? "모집 마감" : `${left}석 남음`, warn: left > 0 && left <= 3 },
    {
      icon: departureConfirmed ? CircleCheck : CircleDashed,
      label: "출발",
      value: departureConfirmed ? "확정" : "미확정",
      sub: departureConfirmed ? "" : "최소 인원 모집 중",
    },
    { icon: RotateCcw, label: "환불", value: refund.title, sub: refund.sub },
  ];
  return (
    <div className="grid grid-cols-4 gap-1 rounded-xl border border-border bg-card px-2 py-3 text-center" aria-label="핵심 요약">
      {items.map(({ icon: Icon, label, value, sub, warn }) => (
        <div key={label} className="min-w-0 space-y-0.5">
          <Icon className="mx-auto h-5 w-5 text-primary" aria-hidden="true" />
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="break-keep text-[13px] font-bold leading-tight text-foreground">{value}</p>
          {sub && <p className={warn ? "text-[10.5px] font-semibold text-destructive" : "text-[10.5px] text-muted-foreground"}>{sub}</p>}
        </div>
      ))}
    </div>
  );
}
