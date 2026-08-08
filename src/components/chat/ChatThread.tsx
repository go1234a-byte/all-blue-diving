import { useEffect, useRef, useState } from "react";
import { Send, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const [text, setText] = useState(""); const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const accessible = tour ? isChatAccessible(tour) : true;
  const messages = accessible ? chatMessages.filter((m) => m.tourId === tourId) : [];

  // 채팅방을 열었을 때, 그리고 새 메시지가 도착했을 때 항상 최신 메시지가 보이도록
  // 메시지 목록을 맨 아래로 자동 스크롤한다. 이게 없으면 오래된 메시지부터 보여서
  // 사용자가 매번 손으로 끝까지 내려야 최신 대화를 볼 수 있었다.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages.length]);

  const currentSenderRole = role === "instructor" ? "instructor" : role === "admin" ? "admin" : "diver";
  const currentSenderName = profile?.name ?? (role === "admin" ? "관리자" : "게스트 다이버");

  const handleSend = async () => {
    if (!text.trim() || !accessible) return;
    const body = text.trim();
    // 실패해도 사용자가 계속 대화창을 보고 있을 확률이 높으므로 낙관적으로 먼저 비운다.
    // 다만 예전에는 이 insert가 실패하면 입력했던 내용이 그대로 사라져 다시 타이핑해야
    // 했다 — 실패 시 입력값을 복구하고 실패 사실을 토스트로 알린다.
    setText("");
    inputRef.current?.focus();
    try {
      await addChatMessage({
        tourId,
        senderProfileId: profile?.id ?? "guest",
        senderName: currentSenderName,
        senderRole: currentSenderRole,
        body,
      });
    } catch (err) {
      setText(body);
      toast({
        title: "메시지 전송에 실패했습니다",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-[calc(100svh-220px)] flex-col overflow-hidden rounded-xl border border-border bg-card">
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
          {/* min-h-0이 없으면 flex 자식 기본값(min-height: auto) 때문에 이 목록이 부모의
              고정 높이를 무시하고 메시지 개수만큼 계속 늘어나 버려서, overflow-y-auto가
              전혀 작동하지 않고(채팅창 자체가 화면 밖으로 넘어가고) 페이지 전체가 스크롤되는
              문제가 있었다. min-h-0을 줘야 이 안에서만 스크롤되는 채팅창이 된다. */}
          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((msg) => {
              const mine = msg.senderProfileId === (profile?.id ?? "guest");
              const isStaff = msg.senderRole === "instructor" || msg.senderRole === "admin";
              return (
                <div key={msg.id} className={cn("flex gap-2", mine ? "flex-row-reverse" : "flex-row")}>
                  {/* 내가 보낸 말풍선에는 아바타도 이름과 마찬가지로 표시하지 않는다 —
                      카카오톡처럼 본인 메시지는 말풍선만 오른쪽에 붙어 있으면 충분하고,
                      아바타까지 있으면 오히려 위치가 애매해 보인다는 피드백을 반영했다. */}
                  {!mine && (
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className={cn(isStaff && "bg-primary text-primary-foreground")}>
                        {msg.senderName[0]}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("max-w-[75%] space-y-1", mine && "items-end text-right")}>
                    {/* 카카오톡처럼 내가 보낸 말풍선에는 이름을 표시하지 않는다(누가 봐도 본인
                        메시지라 안 그러면 오른쪽에 붙는 이름 위치가 애매해 보이는 문제가 있었다).
                        상대방 메시지에만 이름을 보여준다. */}
                    {!mine && <p className="text-[11px] text-muted-foreground">{msg.senderName}</p>}
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
            <Input ref={inputRef}
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
