import type { Tour } from "@/types";
import { computeDaysRemaining, refundSummary } from "@/lib/refund";
import { seatsLeft } from "@/lib/tourDisplay";
import { formatNightsDaysKR } from "@/lib/dates";
import { tourLevelLabel, tourTotalDays } from "@/lib/tourLabels";

interface Props {
  tour: Pick<Tour, "startDate" | "endDate" | "maxParticipants" | "certificationLevel" | "minLogCount">;
  joined: number;
}

/** 상세 첫 화면 사실표 2×2 — 기간·출발일 / 정원·남은 자리 / 환불 / 참가 조건. 값은 모두 실제 데이터·규정에서 계산한다.
 * (출발확정 여부는 제목 위 라벨로 보여준다.) */
export function TourSummaryStrip({ tour, joined }: Props) {
  const left = seatsLeft(tour, joined);
  const refund = refundSummary(computeDaysRemaining(tour.startDate));
  const start = new Date(tour.startDate);
  const items = [
    {
      label: "기간",
      value: tourTotalDays(tour) <= 1 ? "당일" : formatNightsDaysKR(tour.startDate, tour.endDate),
      sub: `${start.getMonth() + 1}/${start.getDate()} 출발`,
    },
    { label: "정원", value: `${tour.maxParticipants}명`, sub: left === 0 ? "모집 마감" : `${left}석 남음`, warn: left > 0 && left <= 3 },
    { label: "환불", value: refund.title, sub: refund.sub },
    { label: "참가 조건", value: tourLevelLabel(tour), sub: "" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2" aria-label="핵심 요약">
      {items.map(({ label, value, sub, warn }) => (
        <div key={label} className="min-w-0 rounded-xl border border-border bg-card px-3 py-2.5">
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="break-keep text-[14px] font-bold leading-tight text-foreground">{value}</p>
          {sub && <p className={warn ? "mt-0.5 text-[11.5px] font-semibold text-destructive" : "mt-0.5 text-[11.5px] text-muted-foreground"}>{sub}</p>}
        </div>
      ))}
    </div>
  );
}
