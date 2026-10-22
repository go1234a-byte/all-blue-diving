/**
 * 운영 DB에 들어 있는 시연용 샘플(투어 제목·강사 이름·후기 본문에 "(샘플" 표기)인지.
 * 샘플 투어는 예약을 막고 "예시 투어"로 크게 표시한다 — DB 트리거(bookings)도 같은 기준으로 막는다.
 */
export function isSampleContent(text: string | undefined | null): boolean {
  return Boolean(text?.includes("(샘플"));
}
