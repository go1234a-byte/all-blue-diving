export function formatDateKR(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export function formatDateRangeKR(startIso: string, endIso: string): string {
  return `${formatDateKR(startIso)} - ${formatDateKR(endIso)}`;
}

/** 투어 기간을 "N박 M일" 형태로 표기한다 (당일치기는 "당일"). */
export function formatNightsDaysKR(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endIso);
  end.setHours(0, 0, 0, 0);
  const nights = Math.round((end.getTime() - start.getTime()) / 86400000);
  if (nights <= 0) return "당일";
  return `${nights}박 ${nights + 1}일`;
}

/** 관리자 화면 등에서 작성자를 특정해야 할 때 쓰는 날짜+시간 표기 (YYYY.MM.DD HH:mm). */
export function formatDateTimeKR(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${formatDateKR(iso)} ${h}:${min}`;
}

export function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function toISODate(d: Date): string {
  // 주의: d.toISOString()은 UTC 기준으로 변환하므로 한국(UTC+9) 등 UTC보다 빠른
  // 시간대에서는 로컬 자정 날짜가 하루 전 날짜로 바뀌는 버그가 있었다.
  // (예: 오늘 날짜가 항상 "지난 날짜"로 취급되어 달력에서 선택 불가로 표시됨)
  // 로컬 연/월/일 값을 그대로 사용해 이 문제를 해결한다.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isPastDate(iso: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(iso).getTime() < today.getTime();
}

export function dDayLabel(targetIso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetIso);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return "D-DAY";
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
}

export function currentMonthIndex(): number {
  return new Date().getMonth(); // 0-based
}

export function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

export type AdminPeriodFilter = "today" | "week" | "month" | "year" | "custom";

/** 관리자 상단바의 기간(오늘/이번주/이번달/올해/직접 선택)이 특정 날짜에 해당하는지 판별한다.
 * "직접 선택"은 아직 범위를 고르지 않았으면(from/to 미지정) 전체를 보여준다(필터 없음). */
export function isWithinAdminPeriod(
  iso: string,
  period: AdminPeriodFilter,
  customRange?: { from?: Date; to?: Date }
): boolean {
  if (period === "custom") {
    if (!customRange?.from) return true;
    const target = new Date(iso).getTime();
    const from = new Date(customRange.from);
    from.setHours(0, 0, 0, 0);
    const to = new Date(customRange.to ?? customRange.from);
    to.setHours(23, 59, 59, 999);
    return target >= from.getTime() && target <= to.getTime();
  }
  const now = new Date();
  const target = new Date(iso);
  if (period === "today") {
    return (
      target.getFullYear() === now.getFullYear() &&
      target.getMonth() === now.getMonth() &&
      target.getDate() === now.getDate()
    );
  }
  if (period === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return target.getTime() >= start.getTime();
  }
  if (period === "month") {
    return target.getFullYear() === now.getFullYear() && target.getMonth() === now.getMonth();
  }
  // year
  return target.getFullYear() === now.getFullYear();
}

/** 오늘로부터 n개월 후 날짜를 반환한다 (투어 출발일 등록 가능 범위 제한에 사용). */
export function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

/** 생년월일(YYYY-MM-DD)로부터 만 나이를 계산한다. */
export function calculateAge(birthDateIso: string): number {
  const birth = new Date(birthDateIso);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}
