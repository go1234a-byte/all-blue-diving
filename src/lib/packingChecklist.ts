import type { ActivityType } from "@/types";

// 준비물 체크리스트의 순수 로직. 데이터 호출·React 없이 테스트 가능하게 둔다 (tests/packingChecklist.test.ts).
// 이 파일은 "@/..." 별칭 import를 쓰지 않는다 (타입 전용 import만) — Node 테스트가 직접 읽기 때문이다.

export type ChecklistGroup = "instructor" | "document" | "gear" | "personal" | "health" | "mine";

/** 화면 순서. 강사 요청이 맨 위, 본인 추가 항목이 맨 아래. */
export const GROUP_ORDER: readonly ChecklistGroup[] = ["instructor", "document", "gear", "personal", "health", "mine"];

export const GROUP_LABEL: Record<ChecklistGroup, string> = {
  instructor: "강사님 요청",
  document: "서류",
  gear: "장비",
  personal: "개인 준비물",
  health: "건강",
  mine: "내가 추가한 항목",
};

export interface ChecklistItem {
  key: string;
  label: string;
  group: ChecklistGroup;
  required: boolean;
}

/** 다이버 한 명의 준비물 상태 (tour_checklist_state 한 행). */
export interface ChecklistState {
  checkedKeys: string[];
  hiddenKeys: string[];
  customItems: ChecklistItem[];
}

export const EMPTY_CHECKLIST_STATE: ChecklistState = { checkedKeys: [], hiddenKeys: [], customItems: [] };

export interface ChecklistProgress {
  done: number;
  total: number;
  /** 필수인데 아직 체크하지 않은 항목 수 (화면에서 amber로 표시). 숨긴 항목은 셈에서 뺀다. */
  requiredLeft: number;
}

export const MAX_INSTRUCTOR_ITEMS = 30;
export const MAX_OWN_ITEMS = 20;
export const MAX_ITEM_LABEL_LENGTH = 40;

const BASE_ITEMS: ChecklistItem[] = [
  { key: "passport", label: "여권 또는 신분증", group: "document", required: true },
  { key: "insurance", label: "여행자 보험 서류", group: "document", required: false },
  { key: "swimsuit", label: "수영복과 래시가드", group: "personal", required: true },
  { key: "towel", label: "수건과 여벌 옷", group: "personal", required: false },
  { key: "sunscreen", label: "선크림·모자", group: "personal", required: false },
  { key: "charger", label: "충전기·방수팩", group: "personal", required: false },
];

const SCUBA_ITEMS: ChecklistItem[] = [
  { key: "mask", label: "마스크·스노클", group: "gear", required: true },
  { key: "fins", label: "오리발·부츠", group: "gear", required: false },
  { key: "logbook", label: "다이빙 로그북·자격증", group: "document", required: true },
];

const FREEDIVING_ITEMS: ChecklistItem[] = [
  { key: "fd_weight", label: "웨이트 벨트·웨이트", group: "gear", required: true },
  { key: "fd_fins", label: "프리다이빙 핀", group: "gear", required: false },
];

const LIVEABOARD_ITEMS: ChecklistItem[] = [
  { key: "seasick", label: "멀미약", group: "health", required: false },
  { key: "medicine", label: "개인 상비약", group: "health", required: false },
];

/** 같은 key가 여러 번 나오면 처음 것만 남긴다 (템플릿이 앞이라 템플릿이 우선). */
function dedupeByKey(items: ChecklistItem[]): ChecklistItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.key)) return false;
    seen.add(item.key);
    return true;
  });
}

/** 투어 활동 유형에 맞춘 기본 준비물 목록. 항상 존재한다. */
export function buildPackingTemplate(activityTypes: readonly ActivityType[]): ChecklistItem[] {
  const extras: ChecklistItem[] = [];
  if (activityTypes.includes("scuba")) extras.push(...SCUBA_ITEMS);
  if (activityTypes.includes("freediving")) extras.push(...FREEDIVING_ITEMS);
  if (activityTypes.includes("liveaboard")) extras.push(...LIVEABOARD_ITEMS);
  return dedupeByKey([...BASE_ITEMS, ...extras]);
}

/**
 * 강사가 tours.checklist_items에 넣은 jsonb를 검증한다. 잘못된 항목은 조용히 버린다.
 * 강사 항목은 그룹을 고르지 않고 항상 "강사님 요청"이다 (저장된 group 값은 무시).
 */
export function parseInstructorItems(raw: unknown): ChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  const items: ChecklistItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const key = typeof record.key === "string" ? record.key.trim() : "";
    const label = typeof record.label === "string" ? record.label.trim().slice(0, MAX_ITEM_LABEL_LENGTH) : "";
    if (!key || !label) continue;
    items.push({ key, label, group: "instructor", required: record.required === true });
    if (items.length >= MAX_INSTRUCTOR_ITEMS) break;
  }
  return dedupeByKey(items);
}

/** 다이버가 직접 추가한 항목(jsonb)을 검증한다. 항목은 항상 "내가 추가한 항목" 그룹이다. */
export function parseCustomItems(raw: unknown): ChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  const items: ChecklistItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const key = typeof record.key === "string" ? record.key.trim() : "";
    const label = typeof record.label === "string" ? record.label.trim().slice(0, MAX_ITEM_LABEL_LENGTH) : "";
    if (!key || !label) continue;
    items.push({ key, label, group: "mine", required: false });
    if (items.length >= MAX_OWN_ITEMS) break;
  }
  return dedupeByKey(items);
}

/** 다이버가 입력한 이름으로 새 항목을 만든다. 공백만 있으면 null. */
export function buildOwnItem(label: string, now: number = Date.now()): ChecklistItem | null {
  const trimmed = label.trim().slice(0, MAX_ITEM_LABEL_LENGTH);
  if (!trimmed) return null;
  return { key: `own-${now.toString(36)}`, label: trimmed, group: "mine", required: false };
}

/**
 * 템플릿 + 강사 항목 + 본인 항목을 합치고, 숨긴 항목을 뺀 뒤 체크 상태를 반영한다.
 * 알 수 없는 key의 체크·숨김은 무시한다. 진행률은 보이는 항목 기준이다.
 */
export function mergeChecklist(
  template: readonly ChecklistItem[],
  instructorItems: readonly ChecklistItem[],
  state: ChecklistState,
): {
  items: (ChecklistItem & { checked: boolean })[];
  hiddenItems: ChecklistItem[];
  progress: ChecklistProgress;
} {
  const combined = dedupeByKey([...template, ...instructorItems, ...state.customItems]);
  const hidden = new Set(state.hiddenKeys);
  const checked = new Set(state.checkedKeys);
  const visible = combined.filter((item) => !hidden.has(item.key));
  const items = visible.map((item) => ({ ...item, checked: checked.has(item.key) }));
  const done = items.filter((item) => item.checked).length;
  return {
    items,
    hiddenItems: combined.filter((item) => hidden.has(item.key)),
    progress: {
      done,
      total: items.length,
      requiredLeft: items.filter((item) => item.required && !item.checked).length,
    },
  };
}

/** 출발일까지 남은 일수 (오늘 = 0, 지났으면 음수). 날짜만 비교하므로 시각과 무관하다. */
export function daysUntil(startDateIso: string, today: Date = new Date()): number {
  const [y, m, d] = startDateIso.slice(0, 10).split("-").map(Number);
  const start = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((start - now) / 86400000);
}

export function progressPercent(progress: ChecklistProgress): number {
  return progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100);
}

/**
 * 수온별 슈트 두께 보조 문구. 수온이 0 이하(미입력)면 문구를 보이지 않는다.
 * 생성 폼이 수온을 0으로 저장하므로, 0은 "모름"으로 취급한다.
 */
export function suitHint(waterTempC: number): string | null {
  if (!(waterTempC > 0)) return null;
  const t = Math.round(waterTempC);
  if (t < 20) return `수온 ${t}°C, 5mm 이상 웻슈트를 권장해요`;
  if (t < 25) return `수온 ${t}°C, 3mm 웻슈트면 충분해요`;
  return `수온 ${t}°C, 래시가드만으로도 괜찮아요`;
}

/** 투어 포함 항목에 "대여"가 명확히 적힌 경우에만 true. 애매하면 false (문구를 보이지 않는다). */
export function rentalIncluded(inclusions: readonly string[]): boolean {
  return inclusions.some((text) => /대여/.test(text));
}

/**
 * 예상 수온 입력 파싱. 비우면 0(=모름)으로 저장하고, 0~40 범위의 숫자만 받는다.
 * 범위를 벗어나거나 숫자가 아니면 null (폼에서 막는다).
 */
export function parseWaterTempInput(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0 || value > 40) return null;
  return Math.round(value);
}
