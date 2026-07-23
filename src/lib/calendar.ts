import type { Invoice, Tour } from "@/types";
import { formatKRW } from "@/lib/pricing";

export interface CalendarEventData {
  title: string;
  description: string;
  startISO: string; // ISO date (YYYY-MM-DD)
  endISO: string; // ISO date (YYYY-MM-DD), exclusive-friendly (all-day event)
}

/**
 * 투어 메타데이터로 캘린더 이벤트 페이로드를 구성한다.
 * 제목/설명에 강사가 [투어 생성] 화면에서 입력한 포함/불포함/준비물 텍스트와
 * 전액 결제 완료 상태(현장 잔금 0원)가 그대로 반영된다.
 */
export function buildTourCalendarEvent(tour: Tour, instructorName: string, invoice?: Invoice): CalendarEventData {
  const title = `[ALL BLUE] 담당 강사 ${instructorName}과 함께하는 다이빙 투어`;

  const descriptionLines = [
    `투어명: ${tour.title}`,
    `장소: ${tour.country} · ${tour.site}`,
    "",
  ];

  if (invoice) {
    descriptionLines.push(
      "[🧾 최종 결제 영수증 상세 내역]",
      `투어 기본 금액: ${formatKRW(invoice.basePrice)}`,
      ...invoice.selectedOptions.map((o) => `• ${o.name} 추가: ${formatKRW(o.price)}`),
      `투어 금액 소계: ${formatKRW(invoice.basePrice + invoice.optionsCost)}`,
      `플랫폼 수수료 10%: ${formatKRW(invoice.platformFee)}`,
      `최종 총 결제 금액(전액 결제 완료): ${formatKRW(invoice.totalDue)}`,
      `현장 지불 잔금: ${formatKRW(invoice.onSiteBalance)}`,
      "처리 결과: 정상 환불 완료 (카드사 영업일 기준 3~7일 소요)",
      "",
    );
  }

  descriptionLines.push(
    "[포함 사항]",
    ...tour.inclusions.map((item) => `- ${item}`),
    "",
    "[불포함 사항]",
    ...tour.exclusions.map((item) => `- ${item}`),
  );

  if (tour.prepNotes) {
    descriptionLines.push("", "[강사 추천 준비물]", tour.prepNotes);
  }

  return {
    title,
    description: descriptionLines.join("\n"),
    startISO: tour.startDate,
    endISO: tour.endDate,
  };
}

function toIcsDate(iso: string): string {
  return iso.replace(/-/g, "");
}

/** 종료일 다음날 자정을 계산 (iCalendar 종일 이벤트는 DTEND가 배타적/exclusive). */
function nextDayIso(iso: string): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function buildIcsString(event: CalendarEventData): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const uid = `allblue-${Date.now()}@allblue.pro`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ALL BLUE//Tour Booking//KR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${toIcsDate(event.startISO)}`,
    `DTEND;VALUE=DATE:${toIcsDate(nextDayIso(event.endISO))}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** iOS(아이폰/아이패드) Safari 여부. iPadOS 13+는 데스크톱 UA를 흉내내므로 터치포인트로도 함께 판별한다. */
function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iP(hone|od|ad)/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

/**
 * .ics 파일을 생성해 캘린더 앱으로 전달한다. Apple Calendar / Outlook / 대부분의 캘린더 앱에서
 * 바로 열 수 있는 표준 iCalendar 포맷.
 *
 * iOS Safari는 Blob 객체 URL + <a download> 방식의 다운로드를 신뢰성 있게 처리하지 못해
 * (링크를 눌러도 아무 반응이 없거나 새 탭만 열리는 문제) "구글 캘린더는 되는데 애플은 안 된다"는
 * 문제의 원인이었다.
 *
 * 이전에는 iOS에서 data: URI로 최상위 페이지를 이동시키는 방식으로 우회했지만, WebKit이 보안
 * 정책상 data: URI로의 최상위 네비게이션을 차단하면서(피싱 방지 목적) 버튼을 눌러도 아무 반응이
 * 없는 동일한 증상이 재발했다. 지금은 Blob URL을 새 탭으로 직접 열어(window.open), Safari가
 * text/calendar MIME 타입을 인식해 "캘린더에 추가" 화면을 띄우도록 한다. 팝업이 차단된 경우에는
 * 현재 탭 이동으로 한 번 더 시도한다.
 */
export function downloadIcsFile(event: CalendarEventData, fileName = "allblue-tour.ics"): void {
  const ics = buildIcsString(event);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  if (isIOSDevice()) {
    const opened = window.open(url, "_blank");
    if (!opened) {
      window.location.href = url;
    }
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    return;
  }

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 구글 캘린더 "일정 추가" 딥링크를 생성한다. 클릭 시 새 탭에서 사전 입력된 일정 작성 화면이 열린다.
 */
export function buildGoogleCalendarUrl(event: CalendarEventData): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toIcsDate(event.startISO)}/${toIcsDate(nextDayIso(event.endISO))}`,
    details: event.description,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
