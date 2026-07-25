import { useMemo } from "react";
import {
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
import { useAppData } from "@/contexts/AppDataContext";

export interface AdminActivityItem {
  id: string;
  icon: LucideIcon;
  label: string;
  detail: string;
  createdAt: string;
  tone: "default" | "destructive" | "warning" | "success";
  to: string; // 클릭 시 이동할 관리자 페이지 경로
}

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export const ACTIVITY_TONE_CLASSES: Record<AdminActivityItem["tone"], string> = {
  default: "text-primary",
  destructive: "text-destructive",
  warning: "text-warning",
  success: "text-success",
};

/**
 * 관리자 "최근 알림" 통합 피드의 데이터 소스.
 * 예약발생/취소/환불요청/신고접수/문의접수/강사인증요청/센터승인요청/정산완료를 모두 모아
 * 최신순으로 정렬한 전체 목록을 반환한다 (개수 제한 없음 — 대시보드 카드는 이 중 앞부분만 잘라 쓰고,
 * "전체보기"로 들어가는 페이지는 이 전체 목록을 그대로 보여준다).
 */
export function useAdminActivityFeed(): AdminActivityItem[] {
  const { bookings, reports, supportTickets, instructors, centers, payouts, getTourById } = useAppData();

  return useMemo<AdminActivityItem[]>(() => {
    const list: AdminActivityItem[] = [];

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
          to: `/admin/bookings?highlight=${b.id}`,
        });
      } else {
        list.push({
          id: `booking-${b.id}`,
          icon: CalendarPlus,
          label: "예약 발생",
          detail: tour?.title ?? b.tourId,
          createdAt: b.createdAt,
          tone: "default",
          to: `/admin/bookings?highlight=${b.id}`,
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
          to: `/admin/bookings?highlight=${b.id}`,
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
        to: `/admin/reports?highlight=${r.id}`,
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
        to: `/admin/support?highlight=${t.id}`,
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
          to: `/instructor/${i.id}/profile`,
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
        to: `/admin/centers?highlight=${c.id}`,
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
          to: `/admin/payouts?highlight=${p.id}`,
        });
      }
    }

    return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [bookings, reports, supportTickets, instructors, centers, payouts, getTourById]);
}
