import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildGoogleCalendarUrl, downloadIcsFile, type CalendarEventData } from "@/lib/calendar";

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
        {/* 예전에는 webcal://(buildAppleCalendarUrl)로 열었는데, iOS/macOS는 webcal://을
            "이 일정 하나 추가"가 아니라 항상 "구독 캘린더 추가"(주기적으로 다시 불러오는
            읽기전용 캘린더 소스)로 처리한다는 걸 몰랐던 게 원인이었다 — 실제로 서버가 이벤트
            1개짜리 .ics를 내려줘도 iOS 입장에서는 프로토콜 자체가 구독이라 그렇게 뜬다. 다이버가
            "아이폰 캘린더 연동은 되는데 구독 캘린더로 열린다"고 알려준 문제가 바로 이거다.
            downloadIcsFile은 iOS에서 data:text/calendar URI로 이동시켜 Safari가 진짜
            "캘린더에 추가"(일회성 이벤트) 바텀시트를 띄우게 하므로, Apple 버튼도 이 방식으로
            통일한다(iOS가 아닌 환경에서는 기존처럼 .ics 파일이 다운로드된다). */}
        <Button
          type="button"
          variant="outline"
          className="h-auto w-full min-w-0 gap-2 whitespace-normal py-2.5"
          onClick={() => void downloadIcsFile(event)}
        >
          <CalendarPlus className="h-4 w-4 shrink-0" />
          <span className="break-keep text-sm leading-snug tracking-tight">Apple 캘린더에 추가</span>
        </Button>
      </div>
    </div>
  );
}
