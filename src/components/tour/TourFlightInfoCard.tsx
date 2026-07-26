import { PlaneTakeoff, PlaneLanding } from "lucide-react";
import type { TourFlightInfo, TourFlightSegment } from "@/types";

interface TourFlightInfoCardProps {
  flightInfo?: TourFlightInfo;
}

function hasSegmentInfo(segment?: TourFlightSegment): boolean {
  return Boolean(segment && (segment.airport?.trim() || segment.departureTime?.trim() || segment.arrivalTime?.trim()));
}

function SegmentRow({ label, segment }: { label: string; segment: TourFlightSegment }) {
  return (
    <div className="space-y-1 rounded-lg bg-secondary/40 p-3">
      <p className="text-xs font-semibold text-primary">{label}</p>
      {segment.airport?.trim() && (
        <p className="text-sm text-foreground">
          <span className="text-muted-foreground">공항 </span>
          {segment.airport}
        </p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-foreground">
        {segment.departureTime?.trim() && (
          <span>
            <span className="text-muted-foreground">출발 </span>
            {segment.departureTime}
          </span>
        )}
        {segment.arrivalTime?.trim() && (
          <span>
            <span className="text-muted-foreground">도착 </span>
            {segment.arrivalTime}
          </span>
        )}
      </div>
    </div>
  );
}

/** 투어 상세 화면 — 강사 프로필 바로 아래에 노출되는 항공편(가는 편/오는 편) 정보 카드. */
export function TourFlightInfoCard({ flightInfo }: TourFlightInfoCardProps) {
  const hasOutbound = hasSegmentInfo(flightInfo?.outbound);
  const hasInbound = hasSegmentInfo(flightInfo?.inbound);

  if (!hasOutbound && !hasInbound) return null;

  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">항공편 정보</h3>
      <div className="space-y-2">
        {hasOutbound && (
          <div className="flex items-start gap-2">
            <PlaneTakeoff className="mt-3 h-4 w-4 shrink-0 text-primary" />
            <div className="flex-1">
              <SegmentRow label="가는 편" segment={flightInfo!.outbound!} />
            </div>
          </div>
        )}
        {hasInbound && (
          <div className="flex items-start gap-2">
            <PlaneLanding className="mt-3 h-4 w-4 shrink-0 text-primary" />
            <div className="flex-1">
              <SegmentRow label="오는 편" segment={flightInfo!.inbound!} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
