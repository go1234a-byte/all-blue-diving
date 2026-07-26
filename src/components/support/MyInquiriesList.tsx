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
import type { SupportTicketStatus } from "@/types";

interface MyInquiriesListProps {
  userId: string;
}

const STATUS_VARIANT: Record<SupportTicketStatus, "secondary" | "default" | "outline"> = {
  접수: "secondary",
  검토중: "secondary",
  답변완료: "default",
  종료: "outline",
};

/** 마이페이지 > 1:1 문의하기에서, 내가 그동안 접수한 문의 내역과 답변 여부를 확인하는 목록. */
export function MyInquiriesList({ userId }: MyInquiriesListProps) {
  const { supportTickets, supportTicketsLoading, getTourById } = useAppData();
  const [openId, setOpenId] = useState<string>("");

  const myInquiries = supportTickets
    .filter((t) => t.userId === userId && t.type === "inquiry")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (supportTicketsLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>;
  }

  if (myInquiries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
        <MessageSquareText className="h-6 w-6 text-muted-foreground/60" />
        <p>아직 등록한 문의가 없어요.</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible value={openId} onValueChange={setOpenId} className="space-y-2">
      {myInquiries.map((ticket) => {
        return (
          <AccordionItem
            key={ticket.id}
            value={ticket.id}
            className="rounded-xl border border-border bg-card px-3"
          >
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex w-full items-center justify-between gap-2 pr-2 text-left">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-foreground">
                    {ticket.title || "제목 없음"}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateKR(ticket.createdAt)}</p>
                </div>
                <Badge variant={STATUS_VARIANT[ticket.status]} className="shrink-0">
                  {ticket.status}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
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
