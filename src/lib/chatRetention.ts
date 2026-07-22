import type { Tour } from "@/types";

const RETENTION_HOURS = 48;

export const CHAT_RETENTION_NOTICE =
  "완료된 투어는 48시간이 지나면 보안 및 데이터 관리 정책에 따라 채팅방이 자동으로 삭제됩니다.";

/** 투어 종료 후 48시간이 지나지 않았는지 확인한다 (지났으면 채팅방 접근이 차단된다). */
export function isChatAccessible(tour: Pick<Tour, "endDate">): boolean {
  const endTime = new Date(tour.endDate).getTime();
  const cutoff = endTime + RETENTION_HOURS * 60 * 60 * 1000;
  return Date.now() < cutoff;
}

/** 투어 종료 후 채팅방이 자동 삭제되기까지 남은 시간(시간 단위, 음수면 이미 삭제 처리됨). */
export function hoursUntilChatDeletion(tour: Pick<Tour, "endDate">): number {
  const endTime = new Date(tour.endDate).getTime();
  const cutoff = endTime + RETENTION_HOURS * 60 * 60 * 1000;
  return Math.round((cutoff - Date.now()) / (60 * 60 * 1000));
}
