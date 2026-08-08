import { useEffect, useRef, useState } from "react";
import { FileWarning, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { formatDateTimeKR } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface InstructorAdminNoteThreadProps {
  instructorId: string;
  viewerRole: "instructor" | "admin";
  viewerName: string;
}

/**
 * 관리자 ↔ 강사 전용 비공개 안내 메모 스레드.
 * 서류 보완 요청, 반려 사유 등 관리자가 강사에게 남기는 안내를 주고받는 용도로,
 * 관리자와 해당 강사 본인만 열람할 수 있다. 이의신청/분쟁 조정 목적의 비밀 중재방
 * (ArbitrationChatRoom)과는 별개의 채널이다.
 */
export function InstructorAdminNoteThread({ instructorId, viewerRole, viewerName }: InstructorAdminNoteThreadProps) {
  const { instructorAdminNotes, addInstructorAdminNote } = useAppData();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = instructorAdminNotes.filter((m) => m.instructorId === instructorId);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const body = text.trim();
    setText("");
    setSending(true);
    try {
      await addInstructorAdminNote({ instructorId, senderRole: viewerRole, senderName: viewerName, body });
    } catch (err) {
      toast({
        title: "전송에 실패했습니다",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
      setText(body);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100svh-56px)] flex-col overflow-hidden bg-background">
      <div className="border-b border-border bg-secondary/40 px-4 py-3">
        <p className="flex items-start gap-2 break-keep text-xs leading-relaxed text-muted-foreground">
          <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          관리자와 강사 본인만 볼 수 있는 안내 메모입니다. 서류 보완 요청, 반려 사유 등을 주고받는 용도로
          사용해주세요.
        </p>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-xs text-muted-foreground">아직 남긴 안내가 없습니다.</p>
        )}
        {messages.map((msg) => {
          const mine = msg.senderRole === viewerRole;
          const isAdmin = msg.senderRole === "admin";
          return (
            <div key={msg.id} className={cn("flex gap-2", mine ? "flex-row-reverse" : "flex-row")}>
              <Avatar className="h-7 w-7 shrink-0 border border-border">
                <AvatarFallback
                  className={cn(
                    "text-[10px]",
                    isAdmin ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {isAdmin ? "관" : "강"}
                </AvatarFallback>
              </Avatar>
              <div className={cn("max-w-[75%] space-y-1", mine && "items-end text-right")}>
                <p className="break-keep text-[10px] text-muted-foreground">
                  {msg.senderName} {isAdmin ? "(관리자)" : "(강사)"} · {formatDateTimeKR(msg.createdAt)}
                </p>
                <div
                  className={cn(
                    "break-keep whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                    mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {msg.body}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 border-t border-border bg-card p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // IME(한글 등) 조합 확정 Enter까지 전송으로 처리되어 글자가 쪼개져 두 번
            // 전송되는 문제를 막기 위해, 조합이 끝난 뒤의 Enter에서만 전송한다.
            if (e.key === "Enter" && !e.nativeEvent.isComposing) void handleSend();
          }}
          placeholder={viewerRole === "admin" ? "예: 자격증 사본을 다시 제출해주세요" : "답변을 입력하세요"}
          disabled={sending}
        />
        <Button size="icon" className="shrink-0" onClick={() => void handleSend()} disabled={sending} aria-label="전송">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
