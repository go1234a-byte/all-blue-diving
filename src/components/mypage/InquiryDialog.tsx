import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { INQUIRY_CATEGORIES, type InquiryCategory } from "@/types";

interface InquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tourId: string;
  bookingId: string;
  diverId: string;
}

export function InquiryDialog({ open, onOpenChange, tourId, bookingId, diverId }: InquiryDialogProps) {
  const { addInquiry } = useAppData();
  const { toast } = useToast();
  const [category, setCategory] = useState<InquiryCategory>(INQUIRY_CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({ title: "문의 내용을 입력해주세요", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await addInquiry({ tourId, bookingId, diverId, category, message });
      toast({ title: "문의가 접수되었습니다", description: "담당자 확인 후 답변드리겠습니다." });
      setMessage("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>플랫폼에 문의하기</DialogTitle>
          <DialogDescription>
            투어 완료 후 48시간 이내에만 접수 가능합니다. 안전사고, 강사 관련 문제는 신속히 처리됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={category} onValueChange={(v) => setCategory(v as InquiryCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INQUIRY_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="문의하실 내용을 자세히 적어주세요"
            rows={5}
          />
        </div>
        <DialogFooter>
          <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
            문의 접수하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
