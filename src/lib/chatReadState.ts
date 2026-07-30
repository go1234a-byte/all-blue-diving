/**
 * 채팅방(투어 그룹채팅) "안 읽음" 상태를 로컬에 기록한다.
 *
 * 메시지 읽음 여부를 서버에 저장하는 테이블/컬럼이 없어서(채팅 자체가 클라이언트에서 계산하는
 * 구조), 계정별로 "이 투어 채팅방을 마지막으로 언제 열어봤는지"만 브라우저에 기록해두고, 그
 * 시점 이후에 "내가 보낸 게 아닌" 메시지가 있으면 안 읽은 것으로 간주한다. 정확한 서버 동기화는
 * 안 되지만(다른 기기에서 보면 다시 안 읽음으로 보일 수 있음), 채팅 목록 정렬/뱃지 표시 용도로는
 * 충분하다. 계정별로 키를 분리해야 한다 — 같은 브라우저에서 다이버/강사 테스트 계정을 번갈아
 * 로그인하는 경우가 흔한데, 계정 구분 없이 저장하면 서로 안 읽음 상태를 오염시키게 된다.
 */

const STORAGE_PREFIX = "allblue-chat-lastread:";

function readMap(profileId: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${profileId}`);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** 이 계정이 해당 투어 채팅방을 마지막으로 읽은 시각(ISO). 한 번도 안 열어봤으면 undefined. */
export function getLastReadAt(profileId: string | undefined, tourId: string): string | undefined {
  if (!profileId) return undefined;
  return readMap(profileId)[tourId];
}

/** 채팅방을 열람한 시점을 기록한다(기본값: 지금). */
export function markChatRead(profileId: string | undefined, tourId: string, atISO: string = new Date().toISOString()): void {
  if (typeof window === "undefined" || !profileId) return;
  const map = readMap(profileId);
  map[tourId] = atISO;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${profileId}`, JSON.stringify(map));
  } catch {
    // 사파리 프라이빗 모드 등 localStorage를 못 쓰는 환경에서는 안 읽음 표시 정확도만 낮아지고
    // 앱 동작 자체는 계속되어야 하므로 조용히 무시한다.
  }
}

/** 이 계정 기준으로, 내가 보낸 게 아니면서 마지막 열람 시각 이후에 온 메시지 수. */
export function countUnread(
  profileId: string | undefined,
  tourId: string,
  messages: { senderProfileId: string; createdAt: string }[],
): number {
  if (!profileId) return 0;
  const lastReadAt = getLastReadAt(profileId, tourId);
  return messages.filter((m) => m.senderProfileId !== profileId && (!lastReadAt || m.createdAt > lastReadAt)).length;
}
