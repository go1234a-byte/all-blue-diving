import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { formatDateKR } from "@/lib/dates";
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

/** 관리자 고객센터 큐: 1:1 문의 / 분쟁조정 / 신고를 통합 처리한다. */
export function SupportTicketQueue() {
  const { supportTickets, updateSupportTicketStatus } = useAppData();
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleSave = async (ticketId: string, status: SupportTicketStatus) => {
    setSavingId(ticketId);
    try {
      await updateSupportTicketStatus(ticketId, status, replyDrafts[ticketId]);
    } finally {
      setSavingId(null);
    }
  };

  if (supportTickets.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">접수된 고객센터 문의가 없습니다.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>유형</TableHead>
            <TableHead>카테고리</TableHead>
            <TableHead>내용</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>접수일</TableHead>
            <TableHead className="text-right">처리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {supportTickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell className="font-medium">{TYPE_LABEL[ticket.type]}</TableCell>
              <TableCell>
                {ticket.category ? <Badge variant="outline">{ticket.category}</Badge> : "-"}
              </TableCell>
              <TableCell className="max-w-[240px] space-y-1">
                {ticket.title && <p className="text-xs font-semibold text-foreground">{ticket.title}</p>}
                <p className="truncate text-xs text-muted-foreground">{ticket.content}</p>
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[ticket.status]}>{ticket.status}</Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{formatDateKR(ticket.createdAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex flex-col items-end gap-1.5">
                  <Textarea
                    value={replyDrafts[ticket.id] ?? ticket.adminReply ?? ""}
                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                    placeholder="답변 입력"
                    className="h-16 w-56 text-xs"
                  />
                  <div className="flex gap-1.5">
                    <Select
                      defaultValue={ticket.status}
                      onValueChange={(v) => handleSave(ticket.id, v as SupportTicketStatus)}
                    >
                      <SelectTrigger className="h-8 w-28 text-xs">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
