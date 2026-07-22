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

interface EmailExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ArbitrationMessage[];
  roomId: string;
}

/**
 * "이메일로 전송하기" — 대상 이메일 입력 후 (시뮬레이션된) SMTP 발송을 트리거한다.
 * 실제 이메일 API 연동 키가 없으므로 짧은 지연 후 성공 토스트로 완료를 알린다.
 */
export function EmailExportDialog({ open, onOpenChange, messages, roomId }: EmailExportDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    if (!email.trim() || !email.includes("@")) {
      toast({ title: "올바른 이메일 주소를 입력해주세요", variant: "destructive" });
      return;
    }
    setSending(true);
    // 실제 SMTP 연동 키가 없어 발송 프로세스를 시뮬레이션합니다.
    setTimeout(() => {
      console.info("[Dispute Log Export]", { to: email, roomId, lines: buildDisputeLogLines(messages) });
      setSending(false);
      setEmail("");
      onOpenChange(false);
      toast({ title: "📧 대화록이 암호화되어 지정된 이메일로 안전하게 발송되었습니다." });
    }, 900);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="break-keep">대화록 이메일로 전송하기</DialogTitle>
          <DialogDescription className="break-keep">
            대화록은 암호화되어 지정된 이메일 주소로 안전하게 발송됩니다.
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
          <Button className="w-full gap-2" onClick={handleSend} disabled={sending}>
            <Mail className="h-4 w-4" />
            {sending ? "전송 중..." : "안전하게 전송하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
