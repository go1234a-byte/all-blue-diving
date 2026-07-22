import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateKR } from "@/lib/dates";
import type { InstructorNotificationType } from "@/types";

const TYPE_LABEL: Record<InstructorNotificationType, string> = {
  new_booking: "신규 예약",
  forced_refund_penalty: "강제 환불 페널티",
  min_participants_cancelled: "최소인원 미달 자동취소",
  min_participants_proceed: "최소인원 미달 진행",
  min_participants_decision_needed: "최소인원 미달 결정 필요",
};

/** 모바일 폭에 맞춘 카드형 알림 목록 — 기존 데스크톱 표 대신 사용한다. */
const AdminNotificationsPage = () => {
  const { instructorNotifications, markInstructorNotificationRead } = useAppData();
  const navigate = useNavigate();
  const sorted = [...instructorNotifications].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const handleClick = (n: (typeof sorted)[number]) => {
    if (!n.read) markInstructorNotificationRead(n.id);
    if (n.tourId) navigate(`/tour/${n.tourId}`);
  };

  return (
    <div className="space-y-2">
      {sorted.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">알림 내역이 없습니다.</p>
      )}
      {sorted.map((n) => (
        <button
          key={n.id}
          type="button"
          onClick={() => handleClick(n)}
          className="block w-full space-y-1.5 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-secondary/40"
        >
          <div className="flex items-start justify-between gap-2">
            <Badge variant={n.type === "new_booking" ? "secondary" : "destructive"} className="text-[10px]">
              {TYPE_LABEL[n.type]}
            </Badge>
            <Badge variant={n.read ? "outline" : "default"} className="shrink-0 text-[10px]">
              {n.read ? "읽음" : "안읽음"}
            </Badge>
          </div>
          <p className="line-clamp-1 text-sm text-foreground">{n.tourTitle}</p>
          <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span>{n.diverName ?? "-"}</span>
            <span>{formatDateKR(n.createdAt)}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default AdminNotificationsPage;
