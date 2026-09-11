import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateKR } from "@/lib/dates";
import type { SupportTicketStatus, SupportTicketType } from "@/types";

interface MyInquiriesListProps {
  userId: string;
  /** 1:1 문의/분쟁조정/신고 공용 — 기본은 문의(inquiry). */
  type?: SupportTicketType;
}

const STATUS_VARIANT: Record<SupportTicketStatus, "secondary" | "default" | "outline"> = {
  접수: "secondary",
  검토중: "secondary",
  답변완료: "default",
  종료: "outline",
};

const EMPTY_MESSAGE: Record<SupportTicketType, string> = {
  inquiry: "아직 등록한 문의가 없어요.",
  dispute: "아직 접수한 분쟁조정 신청이 없어요.",
  report: "아직 접수한 신고가 없어요.",
};

/** 마이페이지 > 고객센터에서, 내가 그동안 접수한 문의/분쟁조정/신고 내역과 답변 여부를 확인하는 목록. */
export function MyInquiriesList({ userId, type = "inquiry" }: MyInquiriesListProps) {
  const { supportTickets, supportTicketsLoading, bookings, getTourById } = useAppData();
  const [openId, setOpenId] = useState<string>("");

  const myTickets = supportTickets
    .filter((t) => t.userId === userId && t.type === type)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (supportTicketsLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>;
  }

  if (myTickets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
        <MessageSquareText className="h-6 w-6 text-muted-foreground/60" />
        <p>{EMPTY_MESSAGE[type]}</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible value={openId} onValueChange={setOpenId} className="space-y-2">
      {myTickets.map((ticket) => {
        // 문의는 title이 있지만 분쟁조정/신고는 title 필드를 안 쓰므로, 그 경우
        // 유형(category)을 헤더에 대신 보여준다 — 둘 다 없으면 "제목 없음".
        const heading = ticket.title || ticket.category || "제목 없음";
        const booking = ticket.bookingId ? bookings.find((b) => b.id === ticket.bookingId) : undefined;
        const tour = booking ? getTourById(booking.tourId) : undefined;
        return (
          <AccordionItem
            key={ticket.id}
            value={ticket.id}
            className="rounded-xl border border-border bg-card px-3"
          >
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex w-full items-center justify-between gap-2 pr-2 text-left">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-foreground">{heading}</p>
                  <p className="text-xs text-muted-foreground">{formatDateKR(ticket.createdAt)}</p>
                </div>
                <Badge variant={STATUS_VARIANT[ticket.status]} className="shrink-0">
                  {ticket.status}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              {tour && (
                <p className="text-xs text-muted-foreground">
                  관련 투어: <span className="font-medium text-foreground">{tour.title}</span>
                </p>
              )}
              <p className="whitespace-pre-wrap break-keep text-sm text-foreground">{ticket.content}</p>
              {ticket.attachmentNames.length > 0 && (
                <p className="text-xs text-muted-foreground">첨부파일 {ticket.attachmentNames.length}개</p>
              )}
              {ticket.status === "답변완료" && ticket.adminReply ? (
                <div className="rounded-lg bg-secondary/50 p-3 text-sm">
                  <p className="mb-1 text-xs font-semibold text-primary">ALL BLUE 답변</p>
                  <p className="whitespace-pre-wrap break-keep text-foreground">{ticket.adminReply}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  아직 답변 전이에요. 담당자 확인 후 24시간 이내에 답변드릴게요.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
