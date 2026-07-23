// ALL BLUE — Apple Calendar(webcal://)용 .ics 리소스 API (Vercel Serverless Function)
//
// Enter Cloud(Supabase) Edge Function으로 만들었던 같은 기능을 여기로 옮겼다. Enter Cloud의
// API 게이트웨이가 Authorization 헤더가 없는 요청을 전부 차단하는데(쿼리 파라미터로 anon 키를
// 실어도 인식하지 않음), webcal:// 링크는 애초에 커스텀 헤더를 보낼 수 없는 방식이라 그 경로로는
// 우회가 불가능했다. 이 파일은 프론트엔드와 같은 Vercel 프로젝트에 배포되므로 그런 게이트웨이
// 인증 자체가 없어 문제없이 동작한다.
//
// 동작 방식은 동일하다: 클라이언트가 만든 일정 데이터(제목/설명/날짜)를 base64url로 인코딩해
// ?d= 쿼리 파라미터로 넘기면, 그 값을 그대로 표준 iCalendar(.ics) 텍스트로 바꿔 응답한다.
// 이 요청을 webcal://all-blue-diving.vercel.app/api/ics?d=... 로 열면 macOS/iOS가 파일
// 다운로드 없이 바로 Apple Calendar 앱의 "일정 추가" 화면을 띄운다.

function toIcsDate(iso) {
  return iso.replace(/-/g, "");
}

function nextDayIso(iso) {
  const d = new Date(iso);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function escapeIcsText(text) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function buildIcsString(event) {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const uid = `allblue-${Date.now()}-${Math.random().toString(36).slice(2)}@allblue.pro`;

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

/** base64url(패딩 없음)로 인코딩된 UTF-8 문자열을 복원한다. */
function base64UrlDecode(input) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  return Buffer.from(base64 + pad, "base64").toString("utf-8");
}

export default function handler(req, res) {
  try {
    const data = req.query.d;

    if (!data || Array.isArray(data)) {
      res.status(400).send("missing d query param");
      return;
    }

    const event = JSON.parse(base64UrlDecode(data));

    if (!event.title || !event.startISO || !event.endISO) {
      res.status(400).send("invalid event payload");
      return;
    }

    const ics = buildIcsString({
      title: event.title,
      description: event.description ?? "",
      startISO: event.startISO,
      endISO: event.endISO,
    });

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", 'inline; filename="allblue-tour.ics"');
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(ics);
  } catch (error) {
    res.status(500).send(`error: ${error instanceof Error ? error.message : "unknown"}`);
  }
}
