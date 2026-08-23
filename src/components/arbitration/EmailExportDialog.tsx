import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { ArbitrationMessage } from "@/types";
import { buildDisputeLogLines } from "@/lib/chatExport";
import { sendEmailToAddress } from "@/lib/email";

interface EmailExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ArbitrationMessage[];
  roomId: string;
  instructorId: string;
}

/**
 * "이메일로 전송하기" — 대상 이메일로 대화록을 실제로 발송한다(Resend 연동, send-email
 * 함수의 to/instructorId 모드). 예전에는 실제 발송 없이 성공 토스트만 띄우는 시뮬레이션
 * 이었다 — 분쟁 증거를 다루는 기능이 "발송됐다"고 거짓 확인을 주는 건 실제 분쟁
 * 상황에서 증거 유실로 이어질 수 있어 실제 발송으로 교체했다.
 */
export function EmailExportDialog({ open, onOpenChange, messages, roomId, instructorId }: EmailExportDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast({ title: "올바른 이메일 주소를 입력해주세요", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const lines = buildDisputeLogLines(messages);
      await sendEmailToAddress(email.trim(), instructorId, {
        subject: `ALL BLUE 비밀 중재방 대화록 (${roomId})`,
        body: lines.length > 0 ? lines.join("\n") : "대화 내역이 없습니다.",
      });
      setEmail("");
      onOpenChange(false);
      toast({ title: "📧 대화록이 지정된 이메일로 발송되었습니다." });
    } catch (err) {
      toast({
        title: "이메일 발송에 실패했습니다",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="break-keep">대화록 이메일로 전송하기</DialogTitle>
          <DialogDescription className="break-keep">
            대화록이 지정된 이메일 주소로 발송됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="dispute-export-email">받는 사람 이메일</Label>
          <Input
            id="dispute-export-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <DialogFooter>
          <Button className="w-full gap-2" onClick={() => void handleSend()} disabled={sending}>
            <Mail className="h-4 w-4" />
            {sending ? "전송 중..." : "전송하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
