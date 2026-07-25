import { Link } from "react-router-dom";
import { BellRing } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ACTIVITY_TONE_CLASSES, relativeTime, useAdminActivityFeed } from "@/hooks/useAdminActivityFeed";

const RECENT_ITEMS_LIMIT = 8;

/** 실시간 운영 - 최근 알림: 예약발생/취소/환불요청/신고접수/문의접수/강사인증요청/센터승인요청/정산완료 통합 피드. */
export function RecentActivityFeed() {
  const items = useAdminActivityFeed().slice(0, RECENT_ITEMS_LIMIT);

  return (
    <Card className="accent-top-ocean">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <BellRing className="h-4 w-4 text-primary" />
          최근 알림
        </CardTitle>
        <Link to="/admin/activity" className="text-xs font-medium text-primary hover:underline">
          전체보기
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">최근 활동이 없습니다.</p>
        ) : (
          items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.to}
                className="-mx-1 flex items-start gap-2 rounded-md px-1 py-1 text-xs transition-colors hover:bg-secondary/60"
              >
                <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", ACTIVITY_TONE_CLASSES[item.tone])} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{item.detail}</p>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">{relativeTime(item.createdAt)}</span>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
