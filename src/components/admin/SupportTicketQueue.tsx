import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateTimeKR } from "@/lib/dates";
import { SUPPORT_TICKET_STATUSES, type SupportTicketStatus, type SupportTicketType } from "@/types";

const TYPE_LABEL: Record<SupportTicketType, string> = {
  inquiry: "1:1 문의",
  dispute: "분쟁조정",
  report: "신고",
};

const STATUS_VARIANT: Record<SupportTicketStatus, "secondary" | "default" | "outline" | "destructive"> = {
  접수: "secondary",
  검토중: "default",
  답변완료: "outline",
  종료: "destructive",
};

interface SupportTicketQueueProps {
  /** 지정하면 해당 타입의 접수 건만 보여준다 (예: 신고관리 페이지에서는 report만). 미지정 시 전체. */
  types?: SupportTicketType[];
  emptyMessage?: string;
}

/** 관리자 고객센터 큐: 1:1 문의 / 분쟁조정 / 신고를 통합 처리한다. 모바일 폭에 맞춘 카드형 목록. */
export function SupportTicketQueue({ types, emptyMessage }: SupportTicketQueueProps = {}) {
  const { supportTickets, updateSupportTicketStatus, diverProfiles, instructorProfiles, bookings, getTourById } =
    useAppData();
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const filteredTickets = types ? supportTickets.filter((t) => types.includes(t.type)) : supportTickets;

  /** 문의자 아이디로 이름/연락처/역할과 가장 최근 이용한 투어를 함께 보여준다. */
  const resolveUser = (userId: string) => {
    const diver = diverProfiles.find((p) => p.id === userId);
    const instructor = instructorProfiles.find((p) => p.id === userId);
    const name = diver?.name ?? instructor?.name;
    const phone = diver?.phone ?? instructor?.phone;
    const roleLabel = diver ? "다이버" : instructor ? "강사" : undefined;
    const recentBooking = [...bookings]
      .filter((b) => b.diverId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
    const recentTourTitle = recentBooking ? getTourById(recentBooking.tourId)?.title : undefined;
    return { name, phone, roleLabel, recentTourTitle };
  };

  const handleSave = async (ticketId: string, status: SupportTicketStatus) => {
    setSavingId(ticketId);
    try {
      await updateSupportTicketStatus(ticketId, status, replyDrafts[ticketId]);
    } finally {
      setSavingId(null);
    }
  };

  if (filteredTickets.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage ?? "접수된 고객센터 문의가 없습니다."}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {filteredTickets.map((ticket) => {
        const { name, phone, roleLabel, recentTourTitle } = resolveUser(ticket.userId);
        return (
        <div key={ticket.id} className="space-y-2 rounded-xl border border-border bg-card p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-medium text-foreground">{TYPE_LABEL[ticket.type]}</span>
              {ticket.category && (
                <Badge variant="outline" className="text-[10px]">
                  {ticket.category}
                </Badge>
              )}
            </div>
            <Badge variant={STATUS_VARIANT[ticket.status]} className="shrink-0 text-[10px]">
              {ticket.status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-secondary/50 px-2.5 py-1.5 text-[11px]">
            <span className="font-semibold text-foreground">{name ?? "탈퇴/알 수 없음"}</span>
            {roleLabel && (
              <Badge variant="outline" className="px-1.5 py-0 text-[9px]">
                {roleLabel}
              </Badge>
            )}
            {phone && <span className="text-muted-foreground">{phone}</span>}
            <span className="text-muted-foreground">ID: {ticket.userId}</span>
            <span className="text-muted-foreground">
              · 최근 투어: {recentTourTitle ?? "이용 내역 없음"}
            </span>
          </div>
          {ticket.title && <p className="text-xs font-semibold text-foreground">{ticket.title}</p>}
          <p className="text-xs text-muted-foreground">{ticket.content}</p>
          <p className="text-[11px] text-muted-foreground">접수일시: {formatDateTimeKR(ticket.createdAt)}</p>
          <div className="space-y-1.5 pt-1">
            <Textarea
              value={replyDrafts[ticket.id] ?? ticket.adminReply ?? ""}
              onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
              placeholder="답변 입력"
              className="h-16 w-full text-xs"
            />
            <div className="flex gap-1.5">
              <Select
                defaultValue={ticket.status}
                onValueChange={(v) => handleSave(ticket.id, v as SupportTicketStatus)}
              >
                <SelectTrigger className="h-8 flex-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORT_TICKET_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-8 text-xs"
                disabled={savingId === ticket.id}
                onClick={() => handleSave(ticket.id, ticket.status)}
              >
                답변 저장
              </Button>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}
