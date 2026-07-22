import type { ArbitrationMessage } from "@/types";

/**
 * 대화 시간 표시용 포맷 (YYYY-MM-DD HH:mm).
 */
function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 비밀 중재방 대화록을 `[TIMESTAMP] SENDER: MESSAGE_BODY` 라인 배열로 직렬화한다.
 */
export function buildDisputeLogLines(messages: ArbitrationMessage[]): string[] {
  return messages.map((m) => {
    const senderLabel = m.senderRole === "admin" ? `${m.senderName} (관리자)` : `${m.senderName} (강사)`;
    const attachments = m.attachmentNames?.length ? ` [첨부: ${m.attachmentNames.join(", ")}]` : "";
    return `[${formatTimestamp(m.createdAt)}] ${senderLabel}: ${m.body}${attachments}`;
  });
}

/**
 * 대화록을 `.txt` 파일로 직렬화해 즉시 브라우저 다운로드를 트리거한다.
 * (기존 calendar.ts의 downloadIcsFile과 동일한 Blob + anchor 다운로드 패턴)
 */
export function downloadDisputeLogTxt(messages: ArbitrationMessage[], roomId: string): void {
  const header = [
    "ALL BLUE — 비밀 중재방 대화록",
    `Room ID: ${roomId}`,
    `내보내기 일시: ${formatTimestamp(new Date().toISOString())}`,
    "".padEnd(40, "="),
    "",
  ];
  const content = [...header, ...buildDisputeLogLines(messages)].join("\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `allblue_dispute_log_${roomId}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
