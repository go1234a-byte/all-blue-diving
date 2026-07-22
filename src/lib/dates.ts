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
