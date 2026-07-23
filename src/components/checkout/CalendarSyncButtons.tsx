import { CalendarPlus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildAppleCalendarUrl, buildGoogleCalendarUrl, downloadIcsFile, type CalendarEventData } from "@/lib/calendar";

interface CalendarSyncButtonsProps {
  event: CalendarEventData;
}

export function CalendarSyncButtons({ event }: CalendarSyncButtonsProps) {
  return (
    <div className="w-full space-y-1.5">
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        <Button variant="outline" className="h-auto w-full min-w-0 gap-2 whitespace-normal py-2.5" asChild>
          <a href={buildGoogleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
            <CalendarPlus className="h-4 w-4 shrink-0" />
            <span className="break-keep text-sm leading-snug tracking-tight">Google 캘린더에 추가</span>
          </a>
        </Button>
        {/* webcal://로 열면 파일 다운로드 없이 Apple Calendar 앱이 바로 "일정 추가" 화면을 띄운다
            (구글 캘린더 버튼과 동일한 원클릭 경험). Apple 기기가 아니면 브라우저가 webcal://을
            처리하지 못할 수 있어, 그 경우를 위해 아래에 파일 저장 링크를 별도로 남겨둔다. */}
        <Button variant="outline" className="h-auto w-full min-w-0 gap-2 whitespace-normal py-2.5" asChild>
          <a href={buildAppleCalendarUrl(event)}>
            <CalendarPlus className="h-4 w-4 shrink-0" />
            <span className="break-keep text-sm leading-snug tracking-tight">Apple 캘린더에 추가</span>
          </a>
        </Button>
      </div>
      <button
        type="button"
        onClick={() => void downloadIcsFile(event)}
        className="flex w-full items-center justify-center gap-1.5 text-[11px] text-muted-foreground underline underline-offset-2"
      >
        <Download className="h-3 w-3" />
        (Apple 캘린더 추가가 안 되면) 파일로 저장하기
      </button>
    </div>
  );
}
