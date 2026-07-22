import { CalendarPlus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildGoogleCalendarUrl, downloadIcsFile, type CalendarEventData } from "@/lib/calendar";

interface CalendarSyncButtonsProps {
  event: CalendarEventData;
}

export function CalendarSyncButtons({ event }: CalendarSyncButtonsProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
      <Button variant="outline" className="h-auto w-full min-w-0 gap-2 whitespace-normal py-2.5" asChild>
        <a href={buildGoogleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
          <CalendarPlus className="h-4 w-4 shrink-0" />
          <span className="break-keep text-sm leading-snug tracking-tight">Google 캘린더에 추가</span>
        </a>
      </Button>
      <Button
        variant="outline"
        className="h-auto w-full min-w-0 gap-2 whitespace-normal py-2.5"
        onClick={() => downloadIcsFile(event)}
      >
        <Download className="h-4 w-4 shrink-0" />
        <span className="break-keep text-sm leading-snug tracking-tight">Apple/기타 캘린더 (.ics)</span>
      </Button>
    </div>
  );
}
