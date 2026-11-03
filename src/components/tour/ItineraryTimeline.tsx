import type { TourItineraryDay } from "@/types";
import { stripLeadingLabel } from "@/lib/tourLabels";

/** 일자별 일정을 세로 타임라인으로 — 날짜 제목 아래 핵심(다이빙) 한 줄, 그 아래 브리핑·식사·자유시간을 작게. */
export function ItineraryTimeline({ days }: { days: TourItineraryDay[] }) {
  return (
    <ol className="relative space-y-4 border-l-2 border-border pl-5">
      {days.map((day) => {
        const rows: Array<[string, string | undefined]> = [
          ["다이빙", day.diving],
          ["브리핑", day.briefing],
          ["식사", day.meals],
          ["자유시간", day.freeTime],
        ];
        return (
          <li key={day.dayNumber} className="relative">
            <span aria-hidden="true" className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-card bg-primary" />
            <p className="text-sm font-semibold text-foreground">{day.title}</p>
            {rows
              .filter(([, v]) => v)
              .map(([label, v]) => (
                <p key={label} className="break-keep text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{label} </span>
                  {stripLeadingLabel(label, v as string)}
                </p>
              ))}
          </li>
        );
      })}
    </ol>
  );
}
