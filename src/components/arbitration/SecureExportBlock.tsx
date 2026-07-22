import { useState } from "react";
import { Download, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailExportDialog } from "@/components/arbitration/EmailExportDialog";
import { downloadDisputeLogTxt } from "@/lib/chatExport";
import type { ArbitrationMessage } from "@/types";

interface SecureExportBlockProps {
  messages: ArbitrationMessage[];
  roomId: string;
}

/**
 * 비밀 중재방 헤더에 위치하는 "📥 대화록 안전하게 내보내기" 액션 블록.
 * - .txt 즉시 다운로드
 * - 이메일 전송 모달 오픈
 */
export function SecureExportBlock({ messages, roomId }: SecureExportBlockProps) {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="flex items-center gap-1.5 break-keep text-xs font-semibold text-white">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        📥 대화록 안전하게 내보내기 (Secure Export)
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          variant="outline"
          size="sm"
          className="h-auto min-w-0 gap-1.5 whitespace-normal border-white/20 bg-transparent py-2 text-xs text-white hover:bg-white/10 hover:text-white"
          onClick={() => downloadDisputeLogTxt(messages, roomId)}
        >
          <Download className="h-3.5 w-3.5 shrink-0" />
          <span className="break-keep">텍스트 파일 (.txt) 다운로드</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-auto min-w-0 gap-1.5 whitespace-normal border-white/20 bg-transparent py-2 text-xs text-white hover:bg-white/10 hover:text-white"
          onClick={() => setEmailDialogOpen(true)}
        >
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="break-keep">이메일로 전송하기</span>
        </Button>
      </div>

      <EmailExportDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        messages={messages}
        roomId={roomId}
      />
    </div>
  );
}
