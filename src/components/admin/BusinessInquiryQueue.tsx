import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateTimeKR } from "@/lib/dates";
import { BUSINESS_INQUIRY_STATUSES, type BusinessInquiryStatus } from "@/types";

const STATUS_VARIANT: Record<BusinessInquiryStatus, "secondary" | "outline"> = {
  접수: "secondary",
  답변완료: "outline",
};

/** 관리자 전용 기업/단체 문의 게시판 큐. support_tickets 큐와 동일한 카드형 목록 UI. */
export function BusinessInquiryQueue() {
  const { businessInquiries, businessInquiriesLoading, updateBusinessInquiryStatus } = useAppData();
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const handleSave = async (inquiryId: string, status: BusinessInquiryStatus) => {
    setSavingId(inquiryId);
    try {
      await updateBusinessInquiryStatus(inquiryId, status, replyDrafts[inquiryId]);
    } finally {
      setSavingId(null);
    }
  };

  if (businessInquiriesLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>;
  }

  if (businessInquiries.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">접수된 기업/단체 문의가 없습니다.</p>;
  }

  return (
    <div className="space-y-2">
      {businessInquiries.map((inquiry) => (
        <div
          key={inquiry.id}
          className={`space-y-2 rounded-xl border p-3 ${
            inquiry.id === highlightId ? "border-primary bg-secondary/60" : "border-border bg-card"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-semibold text-foreground">{inquiry.companyName}</span>
            <Badge variant={STATUS_VARIANT[inquiry.status]} className="shrink-0 text-[10px]">
              {inquiry.status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-secondary/50 px-2.5 py-1.5 text-[11px]">
            <span className="font-semibold text-foreground">{inquiry.contactName}</span>
            <span className="text-muted-foreground">{inquiry.phone}</span>
            <span className="text-muted-foreground">{inquiry.email}</span>
          </div>
          <p className="text-xs text-muted-foreground">{inquiry.message}</p>
          <p className="text-[11px] text-muted-foreground">접수일시: {formatDateTimeKR(inquiry.createdAt)}</p>
          <div className="space-y-1.5 pt-1">
            <Textarea
              value={replyDrafts[inquiry.id] ?? inquiry.adminReply ?? ""}
              onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [inquiry.id]: e.target.value }))}
              placeholder="답변 입력"
              className="h-16 w-full text-xs"
            />
            <div className="flex gap-1.5">
              {BUSINESS_INQUIRY_STATUSES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={inquiry.status === s ? "default" : "outline"}
                  className="h-8 flex-1 text-xs"
                  disabled={savingId === inquiry.id}
                  onClick={() => handleSave(inquiry.id, s)}
                >
                  {s}로 저장
                </Button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
