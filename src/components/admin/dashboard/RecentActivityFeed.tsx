import { useMemo } from "react";
import {
  BellRing,
  Building2,
  CalendarPlus,
  CalendarX,
  CircleDollarSign,
  Flag,
  MessageCircle,
  ShieldCheck,
  Undo2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppData } from "@/contexts/AppDataContext";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  icon: LucideIcon;
  label: string;
  detail: string;
  createdAt: string;
  tone: "default" | "destructive" | "warning" | "success";
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

const TONE_CLASSES: Record<ActivityItem["tone"], string> = {
  default: "text-primary",
  destructive: "text-destructive",
  warning: "text-warning",
  success: "text-success",
};

/** 실시간 운영 - 최근 알림: 예약발생/취소/환불요청/신고접수/문의접수/강사인증요청/센터승인요청/정산완료 통합 피드. */
export function RecentActivityFeed() {
  const { bookings, reports, supportTickets, instructors, centers, payouts, getTourById } = useAppData();

  const items = useMemo<ActivityItem[]>(() => {
    const list: ActivityItem[] = [];

    for (const b of bookings) {
      const tour = getTourById(b.tourId);
      if (b.status === "cancelled") {
        list.push({
          id: `booking-cancel-${b.id}`,
          icon: CalendarX,
          label: "예약 취소",
          detail: tour?.title ?? b.tourId,
          createdAt: b.cancelRequestedAt ?? b.createdAt,
          tone: "destructive",
        });
      } else {
        list.push({
          id: `booking-${b.id}`,
          icon: CalendarPlus,
          label: "예약 발생",
          detail: tour?.title ?? b.tourId,
          createdAt: b.createdAt,
          tone: "default",
        });
      }
      if (b.status === "cancel_pending_review") {
        list.push({
          id: `refund-${b.id}`,
          icon: Undo2,
          label: "환불 요청",
          detail: tour?.title ?? b.tourId,
          createdAt: b.cancelRequestedAt ?? b.createdAt,
          tone: "warning",
        });
      }
    }

    for (const r of reports) {
      list.push({
        id: `report-${r.id}`,
        icon: Flag,
        label: "신고 접수",
        detail: `${r.targetName} · ${r.violationType}`,
        createdAt: r.createdAt,
        tone: "destructive",
      });
    }

    for (const t of supportTickets) {
      list.push({
        id: `ticket-${t.id}`,
        icon: MessageCircle,
        label: "문의 접수",
        detail: t.title ?? t.content.slice(0, 20),
        createdAt: t.createdAt,
        tone: "default",
      });
    }

    for (const i of instructors) {
      if (!i.verified) {
        list.push({
          id: `inst-verify-${i.id}`,
          icon: ShieldCheck,
          label: "강사 인증 요청",
          detail: i.name,
          createdAt: i.pledgeSignedAt ?? new Date().toISOString(),
          tone: "default",
        });
      }
    }

    for (const c of centers) {
      list.push({
        id: `center-${c.id}`,
        icon: Building2,
        label: "센터 승인 요청",
        detail: c.name,
        createdAt: c.createdAt,
        tone: "success",
      });
    }

    for (const p of payouts) {
      if (p.status === "released") {
        list.push({
          id: `payout-${p.id}`,
          icon: CircleDollarSign,
          label: "정산 완료",
          detail: `${p.instructorId} · ${p.bookingId}`,
          createdAt: new Date().toISOString(),
          tone: "success",
        });
      }
    }

    return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 8);
  }, [bookings, reports, supportTickets, instructors, centers, payouts, getTourById]);

  return (
    <Card className="accent-top-ocean">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <BellRing className="h-4 w-4 text-primary" />
          최근 알림
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">최근 활동이 없습니다.</p>
        ) : (
          items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex items-start gap-2 text-xs">
                <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", TONE_CLASSES[item.tone])} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{item.detail}</p>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">{relativeTime(item.createdAt)}</span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
