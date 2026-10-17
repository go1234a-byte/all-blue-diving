import type { Tour } from "@/types";
import { formatDateRangeKR, formatNightsDaysKR } from "@/lib/dates";

/**
 * 투어 일정을 SNS·카톡에 바로 올릴 수 있는 세로 이미지(1080×1350, 인스타 4:5)로 그린다.
 * 외부 라이브러리 없이 canvas 로 직접 그려서 번들 크기를 늘리지 않는다.
 * (트리플의 "일정 이미지 저장"과 같은 역할 — 공유될 때마다 올블루 주소가 함께 퍼진다.)
 */
const W = 1080;
const H = 1350;
const FONT = `'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', system-ui, sans-serif`;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const ch of text) {
    const next = cur + ch;
    if (ctx.measureText(next).width > maxWidth && cur) {
      lines.push(cur);
      cur = ch;
      if (lines.length === maxLines) break;
    } else {
      cur = next;
    }
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  if (lines.length === maxLines && text.length > lines.join("").length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.slice(0, Math.max(0, last.length - 1)) + "…";
  }
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function renderTripImage(tour: Tour): Promise<Blob> {
  if (document.fonts?.ready) await document.fonts.ready.catch(() => undefined);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unsupported");

  // 배경: 딥 네이비 그라데이션 + (가능하면) 투어 대표 사진을 상단에 은은하게
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0E3A5C");
  bg.addColorStop(1, "#0A1B2E");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const photo = await loadImage(tour.mainImageUrl);
  if (photo) {
    try {
      const ph = 460;
      const scale = Math.max(W / photo.width, ph / photo.height);
      const dw = photo.width * scale;
      const dh = photo.height * scale;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, ph);
      ctx.clip(); // 사진이 ph 아래로 삐져나와 일정 카드 뒤에 경계선이 생기지 않게
      ctx.globalAlpha = 0.4;
      ctx.drawImage(photo, (W - dw) / 2, (ph - dh) / 2, dw, dh);
      ctx.restore();
      const fade = ctx.createLinearGradient(0, 60, 0, ph);
      // 끝 색은 배경 그라데이션의 ph 지점 색과 같아야 경계선이 안 보인다.
      const k = ph / H;
      const mix = (a: number, b: number) => Math.round(a + (b - a) * k);
      const edge = `${mix(14, 10)},${mix(58, 27)},${mix(92, 46)}`;
      fade.addColorStop(0, `rgba(${edge},0)`);
      fade.addColorStop(1, `rgb(${edge})`);
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, W, ph);
    } catch {
      /* 교차 출처 이미지면 그냥 배경색만 쓴다 */
    }
  }

  const PAD = 80;
  let y = 120;

  ctx.fillStyle = "#7FD8E4";
  ctx.font = `700 30px ${FONT}`;
  ctx.fillText("ALL BLUE · DIVE TRIP", PAD, y);

  y += 70;
  ctx.fillStyle = "rgba(255,255,255,.75)";
  ctx.font = `500 34px ${FONT}`;
  ctx.fillText(`${tour.country} · ${tour.site}`, PAD, y);

  y += 30;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 64px ${FONT}`;
  for (const line of wrap(ctx, tour.title, W - PAD * 2, 2)) {
    y += 80;
    ctx.fillText(line, PAD, y);
  }

  y += 60;
  ctx.font = `600 34px ${FONT}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(`${formatDateRangeKR(tour.startDate, tour.endDate)}  ·  ${formatNightsDaysKR(tour.startDate, tour.endDate)}`, PAD, y);

  // 일자별 일정 카드
  y += 50;
  const allDays = tour.itineraryDays ?? [];
  const days = allDays.slice(0, 6);
  const moreDays = allDays.length - days.length;
  const cardX = PAD;
  const cardW = W - PAD * 2;
  const footerTop = H - 170;
  if (days.length > 0) {
    const rowH = Math.min(150, Math.floor((footerTop - y - (allDays.length > 6 ? 160 : 110)) / days.length));
    roundRect(ctx, cardX, y, cardW, rowH * days.length + 30, 28);
    ctx.fillStyle = "rgba(255,255,255,.08)";
    ctx.fill();
    let ry = y + 15;
    days.forEach((d, i) => {
      ctx.fillStyle = "#17A8BD";
      roundRect(ctx, cardX + 30, ry + 18, 92, 46, 23);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 26px ${FONT}`;
      const tag = `DAY ${d.dayNumber || i + 1}`;
      ctx.fillText(tag, cardX + 76 - ctx.measureText(tag).width / 2, ry + 50);

      ctx.font = `700 34px ${FONT}`;
      const title = d.title.replace(/^\s*\d+\s*일차\s*[-·:]?\s*/, "") || d.title;
      ctx.fillText(wrap(ctx, title, cardW - 190, 1)[0] ?? "", cardX + 150, ry + 46);
      // 여러 줄로 쓴 일정은 첫 줄만, 나머지는 " · "로 이어 한 줄에 담는다.
      const raw = d.diving || d.briefing || d.freeTime || "";
      const sub = raw.split(/\n+/).map((x) => x.trim()).filter(Boolean).join(" · ");
      if (sub && rowH >= 90) {
        ctx.fillStyle = "rgba(255,255,255,.7)";
        ctx.font = `500 27px ${FONT}`;
        ctx.fillText(wrap(ctx, sub, cardW - 190, 1)[0] ?? "", cardX + 150, ry + 90);
      }
      ry += rowH;
    });
    y += rowH * days.length + 30;
    if (moreDays > 0) {
      ctx.fillStyle = "rgba(255,255,255,.6)";
      ctx.font = `500 26px ${FONT}`;
      ctx.fillText(`+ ${moreDays}일 일정 더 보기 — allbluedive.com`, PAD + 30, y + 40);
      y += 50;
    }
  } else {
    ctx.fillStyle = "rgba(255,255,255,.7)";
    ctx.font = `500 30px ${FONT}`;
    ctx.fillText("자세한 일정은 ALL BLUE에서 확인하세요", PAD, y + 40);
  }

  // 집합 정보
  if (tour.meetingPoint && y + 70 < footerTop) {
    ctx.fillStyle = "rgba(255,255,255,.8)";
    ctx.font = `500 28px ${FONT}`;
    const meet = `📍 ${tour.meetingPoint}${tour.meetingTime ? ` · ${tour.meetingTime}` : ""}`;
    ctx.fillText(wrap(ctx, meet, cardW, 1)[0] ?? "", PAD, Math.min(y + 60, footerTop - 20));
  }

  // 푸터
  ctx.strokeStyle = "rgba(255,255,255,.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, footerTop);
  ctx.lineTo(W - PAD, footerTop);
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 40px ${FONT}`;
  ctx.fillText("ALL BLUE", PAD, footerTop + 75);
  ctx.fillStyle = "rgba(255,255,255,.65)";
  ctx.font = `500 28px ${FONT}`;
  const url = "allbluedive.com";
  ctx.fillText(url, W - PAD - ctx.measureText(url).width, footerTop + 72);

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * 파일 공유가 되는 환경(모바일 브라우저)이면 공유 시트를 띄우고, 아니면 내려받는다.
 * 사용자가 공유 시트를 닫은 경우(AbortError)도 성공으로 본다.
 */
export async function shareOrDownloadFile(blob: Blob, filename: string, title: string): Promise<"shared" | "downloaded"> {
  const file = new File([blob], filename, { type: blob.type });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "shared";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}

/** 투어 일정을 캘린더(.ics)로 — 구글/애플/삼성 캘린더 모두 열 수 있는 표준 형식. */
export function buildTripIcs(tour: Pick<Tour, "id" | "title" | "startDate" | "endDate" | "country" | "site" | "meetingPoint" | "meetingTime">): Blob {
  const ymd = (iso: string, plusDays = 0) => {
    const d = new Date(iso);
    d.setDate(d.getDate() + plusDays);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
  };
  const esc = (s: string) => s.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  const desc = [
    `${tour.country} · ${tour.site}`,
    tour.meetingPoint ? `집합: ${tour.meetingPoint}${tour.meetingTime ? ` (${tour.meetingTime})` : ""}` : "",
    `https://allbluedive.com/tour/${tour.id}`,
  ]
    .filter(Boolean)
    .join("\n");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ALL BLUE//Dive Trip//KO",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${tour.id}@allbluedive.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(tour.startDate)}`,
    // 종일 일정의 DTEND는 "다음 날"이 끝(배타적)이다.
    `DTEND;VALUE=DATE:${ymd(tour.endDate, 1)}`,
    `SUMMARY:${esc(`🤿 ${tour.title}`)}`,
    `LOCATION:${esc(tour.meetingPoint || `${tour.country} ${tour.site}`)}`,
    `DESCRIPTION:${esc(desc)}`,
    "BEGIN:VALARM",
    "TRIGGER:-P7D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`${tour.title} 출발 1주일 전 — 준비물 확인하세요`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Blob([ics], { type: "text/calendar;charset=utf-8" });
}

/** 출발까지 남은 날 — 0이면 당일, 음수면 이미 출발(진행 중이거나 종료). */
export function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}
