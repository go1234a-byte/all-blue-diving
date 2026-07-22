import { useState } from "react";
import { Send, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { CHAT_RETENTION_NOTICE, isChatAccessible } from "@/lib/chatRetention";
import { cn } from "@/lib/utils";
import type { Tour } from "@/types";

interface ChatThreadProps {
  tourId: string;
  tour?: Tour;
}

export function ChatThread({ tourId, tour }: ChatThreadProps) {
  const { chatMessages, addChatMessage } = useAppData();
  const { role, profile } = useRole();
  const [text, setText] = useState("");

  const accessible = tour ? isChatAccessible(tour) : true;
  const messages = accessible ? chatMessages.filter((m) => m.tourId === tourId) : [];

  const currentSenderRole = role === "instructor" ? "instructor" : role === "admin" ? "admin" : "diver";
  const currentSenderName = profile?.name ?? (role === "admin" ? "관리자" : "게스트 다이버");

  const handleSend = () => {
    if (!text.trim() || !accessible) return;
    void addChatMessage({
      tourId,
      senderProfileId: profile?.id ?? "guest",
      senderName: currentSenderName,
      senderRole: currentSenderRole,
      body: text.trim(),
    });
    setText("");
  };

  return (
    <div className="flex h-[calc(100vh-220px)] flex-col rounded-xl border border-border bg-card">
      <div className="flex items-start gap-1.5 border-b border-border bg-warning/10 px-3 py-2 text-[11px] text-warning-foreground">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span className="break-keep">{CHAT_RETENTION_NOTICE}</span>
      </div>

      {!accessible ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
          <ShieldAlert className="h-8 w-8 text-muted-foreground" />
          <p className="break-keep">투어 완료 후 48시간이 경과하여 채팅방이 자동으로 삭제되었습니다.</p>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((msg) => {
              const mine = msg.senderProfileId === (profile?.id ?? "guest");
              const isStaff = msg.senderRole === "instructor" || msg.senderRole === "admin";
              return (
                <div key={msg.id} className={cn("flex gap-2", mine ? "flex-row-reverse" : "flex-row")}>
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className={cn(isStaff && "bg-primary text-primary-foreground")}>
                      {msg.senderName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("max-w-[75%] space-y-1", mine && "items-end text-right")}>
                    <p className="text-[11px] text-muted-foreground">{msg.senderName}</p>
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm",
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
          <div className="flex items-center gap-2 border-t border-border p-3">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="메시지를 입력하세요"
            />
            <Button size="icon" onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
