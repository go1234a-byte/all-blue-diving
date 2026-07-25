import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ACTIVITY_TONE_CLASSES, relativeTime, useAdminActivityFeed } from "@/hooks/useAdminActivityFeed";

/**
 * 대시보드 "최근 알림" 카드의 "전체보기" — 예약발생/취소/환불요청/신고접수/문의접수/
 * 강사인증요청/센터승인요청/정산완료를 모두 모은 전체 알림 목록을 개수 제한 없이 보여준다.
 */
const AdminActivityPage = () => {
  const items = useAdminActivityFeed();

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">최근 활동이 없습니다.</p>
      ) : (
        items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.to}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-secondary/40"
            >
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", ACTIVITY_TONE_CLASSES[item.tone])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">{relativeTime(item.createdAt)}</span>
            </Link>
          );
        })
      )}
    </div>
  );
};

export default AdminActivityPage;
