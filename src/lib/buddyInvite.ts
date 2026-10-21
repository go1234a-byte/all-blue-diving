/**
 * 버디 초대 링크 — /tour/:id?buddy=<초대한 사람 profileId>
 *
 * 링크로 들어온 사람의 브라우저(sessionStorage)에 "이 투어는 OO가 초대함"을 기억해 두었다가
 * 결제 화면에서 룸 배정 메모에 "버디 OO님과 같은 방 희망"을 미리 채운다. 강사는 기존 룸 배정
 * 화면에서 그 메모를 그대로 본다 — 결제·예약 저장 구조는 바꾸지 않는다.
 * profileId 는 이미 공개 뷰(public_profiles)에 이름과 함께 노출되는 값이라 링크에 담아도 된다.
 */
const KEY = (tourId: string) => `allblue-buddy-invite:${tourId}`;

export function buildBuddyInviteUrl(tourId: string, inviterProfileId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://allbluedive.com";
  return `${origin}/tour/${tourId}?buddy=${encodeURIComponent(inviterProfileId)}`;
}

export function rememberBuddyInvite(tourId: string, inviterProfileId: string): void {
  try {
    sessionStorage.setItem(KEY(tourId), inviterProfileId);
  } catch {
    /* 저장소를 못 쓰면 이번 화면에서만 표시된다 */
  }
}

export function getBuddyInvite(tourId: string): string | null {
  try {
    return sessionStorage.getItem(KEY(tourId));
  } catch {
    return null;
  }
}

export function clearBuddyInvite(tourId: string): void {
  try {
    sessionStorage.removeItem(KEY(tourId));
  } catch {
    /* ignore */
  }
}

export function buddyRoomNote(inviterName: string): string {
  return `버디 ${inviterName}님과 같은 방 희망 (버디 초대 링크로 예약)`;
}
