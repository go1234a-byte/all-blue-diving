// 악성 이용자 차단. App Store Guideline 1.2 요구사항:
//  - 이용자가 악성 이용자를 차단할 수 있어야 하고,
//  - 차단 시 해당 이용자의 콘텐츠가 즉시 내 화면에서 사라져야 하며,
//  - 차단(신고)이 개발자(운영팀)에게 통보되어야 한다.
// 차단 목록은 기기별(localStorage)로 저장하고, 차단 시 기존 신고(addReport) 흐름으로 운영팀에 통보한다.

const STORAGE_KEY = "allblue-blocked-users";

export interface BlockedUser {
  id: string;
  name: string;
  blockedAt: string;
}

function read(): BlockedUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BlockedUser[]) : [];
  } catch {
    return [];
  }
}

function write(list: BlockedUser[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("allblue-blocks-changed"));
  } catch {
    /* storage 불가 환경은 무시 */
  }
}

export function getBlockedUsers(): BlockedUser[] {
  return read();
}

export function getBlockedUserIds(): Set<string> {
  return new Set(read().map((b) => b.id));
}

export function isUserBlocked(id: string): boolean {
  return read().some((b) => b.id === id);
}

export function blockUser(id: string, name: string): void {
  const list = read();
  if (list.some((b) => b.id === id)) return;
  write([...list, { id, name, blockedAt: new Date().toISOString() }]);
}

export function unblockUser(id: string): void {
  write(read().filter((b) => b.id !== id));
}
