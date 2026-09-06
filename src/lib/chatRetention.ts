const RETENTION_HOURS = 48;

export const CHAT_RETENTION_NOTICE =
  "정산이 완료(강사 정산 완료 + 참가자 전원 정산 확인)되고 48시간이 지나면 채팅방이 자동으로 삭제됩니다.";

interface ChatDeletionArgs {
  instructorSettledAt?: string | null;
  confirmations: { diverId: string; confirmedAt: string }[];
  bookedDiverIds: string[]; // 예약(취소 제외) 다이버 profile id 목록
}

/**
 * 채팅방이 자동 삭제되는 절대 시각(epoch ms)을 계산한다.
 * 강사가 "정산 완료"를 눌렀고 + 예약 다이버 전원이 "정산 확인"을 마친 경우에만
 * 그 마지막 확인 시점 + 48h 를 반환한다. 아직 다 안 됐으면 null (= 삭제하지 않음).
 */
export function chatDeletionCutoffMs({ instructorSettledAt, confirmations, bookedDiverIds }: ChatDeletionArgs): number | null {
  if (!instructorSettledAt) return null;

  // 강사가 "정산 재개" 후 다시 마감했다면, 그 이전에 눌러둔 확인은 무효 —
  // instructor_settled_at 이후의 확인만 센다(재확인을 다시 받아야 타이머가 작동).
  const settledAtMs = new Date(instructorSettledAt).getTime();
  const validConfirmations = confirmations.filter((c) => new Date(c.confirmedAt).getTime() >= settledAtMs);

  const confirmedIds = new Set(validConfirmations.map((c) => c.diverId));
  const everyoneConfirmed = bookedDiverIds.every((id) => confirmedIds.has(id));
  if (!everyoneConfirmed) return null;

  // "완료 시점" = 강사 정산 완료와 마지막 다이버 확인 중 더 나중.
  const lastConfirmTime = validConfirmations.reduce(
    (max, c) => Math.max(max, new Date(c.confirmedAt).getTime()),
    settledAtMs,
  );
  return lastConfirmTime + RETENTION_HOURS * 60 * 60 * 1000;
}

/** cutoff(=chatDeletionCutoffMs 결과)를 받아 지금 채팅방에 접근 가능한지 판단. null이면 항상 접근 가능. */
export function isChatAccessible(cutoffMs: number | null): boolean {
  return cutoffMs === null || Date.now() < cutoffMs;
}

/** 자동 삭제까지 남은 시간(시간 단위). cutoff가 없으면 null. */
export function hoursUntilChatDeletion(cutoffMs: number | null): number | null {
  if (cutoffMs === null) return null;
  return Math.round((cutoffMs - Date.now()) / (60 * 60 * 1000));
}
