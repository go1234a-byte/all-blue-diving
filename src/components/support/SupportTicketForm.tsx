import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDropzone } from "@/components/auth/FileDropzone";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { DISPUTE_TYPES, REPORT_TICKET_TYPES, type SupportTicketType } from "@/types";

interface SupportTicketFormProps {
  type: SupportTicketType;
  userId: string;
}

const TYPE_LABEL: Record<SupportTicketType, string> = {
  inquiry: "1:1 문의",
  dispute: "분쟁조정",
  report: "신고",
};

const TYPE_SUBMIT_LABEL: Record<SupportTicketType, string> = {
  inquiry: "문의 등록",
  dispute: "접수",
  report: "접수",
};

/** 1:1 문의 / 분쟁조정 / 신고를 공용으로 접수하는 폼. type prop에 따라 필드 구성이 달라진다. */
export function SupportTicketForm({ type, userId }: SupportTicketFormProps) {
  const { bookings, getTourById, addSupportTicket } = useAppData();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [bookingId, setBookingId] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const myBookings = bookings.filter((b) => b.diverId === userId);
  const selectedBooking = myBookings.find((b) => b.id === bookingId);
  const selectedTour = selectedBooking ? getTourById(selectedBooking.tourId) : undefined;

  const categoryOptions = type === "dispute" ? DISPUTE_TYPES : type === "report" ? REPORT_TICKET_TYPES : [];

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({ title: "내용을 입력해주세요", variant: "destructive" });
      return;
    }
    if (type !== "inquiry" && !category) {
      toast({ title: `${type === "dispute" ? "분쟁 유형" : "신고 유형"}을 선택해주세요`, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await addSupportTicket({
        userId,
        bookingId: bookingId || undefined,
        type,
        category: category || undefined,
        title: title.trim() || undefined,
        content: content.trim(),
        attachmentNames: attachments.map((f) => f.name),
      });
      toast({ title: `${TYPE_LABEL[type]}가 접수되었습니다`, description: "담당자 확인 후 답변드리겠습니다." });
      setTitle("");
      setContent("");
      setAttachments([]);
      setBookingId("");
      setCategory("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {(type === "dispute") && (
        <div className="space-y-1.5">
          <Label>예약번호 선택</Label>
          <Select value={bookingId} onValueChange={setBookingId}>
            <SelectTrigger>
              <SelectValue placeholder="예약 선택" />
            </SelectTrigger>
            <SelectContent>
              {myBookings.map((b) => {
                const tour = getTourById(b.tourId);
                return (
                  <SelectItem key={b.id} value={b.id}>
                    {tour?.title ?? b.id} ({b.id})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {type === "dispute" && selectedTour && (
        <div className="rounded-lg bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
          투어: <span className="font-medium text-foreground">{selectedTour.title}</span>
        </div>
      )}

      {(type === "dispute" || type === "report") && (
        <div className="space-y-1.5">
          <Label>{type === "dispute" ? "분쟁 유형" : "신고 유형"}</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="유형 선택" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {type === "inquiry" && (
        <div className="space-y-1.5">
          <Label>제목</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="문의 제목을 입력해주세요" />
        </div>
      )}

      <div className="space-y-1.5">
        <Label>내용</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="자세한 내용을 입력해주세요"
          rows={5}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{type === "inquiry" ? "이미지 첨부" : "첨부파일"} (선택)</Label>
        <FileDropzone
          label="파일 업로드"
          multiple
          maxFiles={5}
          accept="image/*,.pdf"
          onFilesChange={setAttachments}
        />
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "접수 중..." : TYPE_SUBMIT_LABEL[type]}
      </Button>
    </div>
  );
}
