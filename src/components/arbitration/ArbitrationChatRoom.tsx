import { useEffect, useRef, useState } from "react";
import { Camera, Lock, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SecureExportBlock } from "@/components/arbitration/SecureExportBlock";
import { useAppData } from "@/contexts/AppDataContext";
import { cn } from "@/lib/utils";

interface ArbitrationChatRoomProps {
  instructorId: string;
  instructorName: string;
  viewerRole: "instructor" | "admin";
  viewerName: string;
}

/**
 * 강사 ↔ 최고관리자 전용 비밀 중재방.
 * 프리미엄 다크 네이비 톤으로 일반 채팅과 시각적으로 완전히 분리된다.
 * 헤더의 SecureExportBlock을 통해 대화록을 .txt 다운로드하거나 이메일로 전송할 수 있다.
 */
export function ArbitrationChatRoom({ instructorId, instructorName, viewerRole, viewerName }: ArbitrationChatRoomProps) {
  const { arbitrationMessages, addArbitrationMessage } = useAppData();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roomId = `arb-${instructorId}`;
  const messages = arbitrationMessages.filter((m) => m.roomId === roomId);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages.length]);

  const handleSend = () => {
    if (!text.trim()) return;
    addArbitrationMessage({
      roomId,
      instructorId,
      senderRole: viewerRole,
      senderName: viewerName,
      body: text.trim(),
    });
    setText("");
  };

  const handleAttach = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    addArbitrationMessage({
      roomId,
      instructorId,
      senderRole: viewerRole,
      senderName: viewerName,
      body: "증빙 이미지를 전송했습니다.",
      attachmentNames: Array.from(files).map((f) => f.name),
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col overflow-hidden bg-[#050b18]">
      {/* 상단 고정 보안 고지 배너 */}
      <div className="border-b border-white/10 bg-[#0a1428] px-4 py-3">
        <p className="flex items-start gap-2 break-keep text-[11px] leading-relaxed text-primary-glow">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          🔒 본 채팅방은 플랫폼 최고 관리자 전용 비밀 중재방입니다. 이의 신청 서류 및 대화록은 관련 규정에
          의거하여 보관됩니다.
        </p>
        <div className="mt-2.5">
          <SecureExportBlock messages={messages} roomId={roomId} />
        </div>
      </div>

      {/* 메시지 로그 */}
      {/* min-h-0 없이는 flex 자식이 부모의 고정 높이를 무시하고 내용만큼 계속 늘어나서
          overflow-y-auto가 작동하지 않는(채팅방 자체가 화면 밖으로 넘어가는) 문제가 있었다 —
          ChatThread.tsx와 동일한 원인/수정. */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-xs text-white/40">
            아직 대화 내역이 없습니다. 이의신청 관련 내용을 남겨주세요.
          </p>
        )}
        {messages.map((msg) => {
          const mine = msg.senderRole === viewerRole;
          const isAdmin = msg.senderRole === "admin";
          return (
            <div key={msg.id} className={cn("flex gap-2", mine ? "flex-row-reverse" : "flex-row")}>
              <Avatar className="h-7 w-7 shrink-0 border border-white/10">
                <AvatarFallback className={cn("text-[10px]", isAdmin ? "bg-destructive text-destructive-foreground" : "bg-primary-glow text-[#050b18]")}>
                  {isAdmin ? "관" : "강"}
                </AvatarFallback>
              </Avatar>
              <div className={cn("max-w-[75%] space-y-1", mine && "items-end text-right")}>
                <p className="break-keep text-[10px] text-white/40">
                  {msg.senderName} {isAdmin ? "(최고관리자)" : "(강사)"}
                </p>
                <div
                  className={cn(
                    "break-keep rounded-2xl px-3 py-2 text-sm",
                    mine ? "bg-primary-glow text-[#050b18]" : "bg-white/10 text-white",
                  )}
                >
                  {msg.body}
                  {msg.attachmentNames && msg.attachmentNames.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-[11px] opacity-80">
                      {msg.attachmentNames.map((name) => (
                        <li key={name} className="truncate">
                          📎 {name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 입력 바 */}
      <div className="flex items-center gap-2 border-t border-white/10 bg-[#0a1428] p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleAttach(e.target.files)}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="shrink-0 text-white hover:bg-white/10 hover:text-white"
          onClick={() => fileInputRef.current?.click()}
          aria-label="증빙 이미지 첨부"
        >
          <Camera className="h-4 w-4" />
        </Button>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
                // 한글(또는 일본어/중국어) IME로 조합 중일 때 조합을 확정하려고 누르는
                // Enter까지 "전송"으로 처리되어, 아직 완성되지 않은 글자만 먼저 보내지고
                // 남은 글자가 다음 Enter에 따로 전송되는 버그가 있었다(예: "에헤" 입력 중
                // 말풍선이 "에ㅔㅔ"/"ㅔ"처럼 쪼개져서 두 번 전송됨). isComposing이 true인
                // 동안(조합 확정 Enter)에는 전송하지 않고, 조합이 끝난 뒤의 Enter에서만 보낸다.
                if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSend();
              }}
          placeholder="중재 관련 메시지를 입력하세요"
          className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
        />
        <Button size="icon" className="shrink-0" onClick={handleSend} aria-label="전송">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
