import { useEffect, useRef, useState } from "react";
import { Bot, MessageSquareWarning, Send, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SUPPORT_FAQ_CATEGORIES } from "@/types";
import { cn } from "@/lib/utils";

type ChatMode = "chatbot" | "live_agent";

interface DisplayMessage {
  id: string;
  role: "bot" | "system" | "user" | "agent";
  body: string;
}

const FAQ_CHIPS: { label: string; answer: string }[] = [
  {
    label: "카드 환불 소요기간",
    answer:
      "카드 결제 취소 및 환불은 카드사 정책에 따라 실제 반영까지 영업일 기준 3~7일 정도 소요될 수 있습니다.",
  },
  {
    label: "불가항력 서류 안내",
    answer:
      "의료·천재지변 등 불가피한 사유로 취소하시는 경우, 마이페이지 > 내 예약 내역에서 증빙서류(진단서, 기상 악화 자료 등)를 첨부해 제출하시면 운영팀 심사 후 환불 여부가 결정됩니다.",
  },
  {
    label: "플랫폼 수수료 문의",
    answer:
      "ALL BLUE는 투어 기본 금액과 선택 옵션 금액 합계의 10%를 플랫폼 이용 수수료로 결제 시점에 함께 청구합니다. 자세한 내역은 체크아웃 영수증에서 확인하실 수 있습니다.",
  },
];

const FAQ_CATEGORY_ITEMS: Record<(typeof SUPPORT_FAQ_CATEGORIES)[number], string[]> = {
  예약: ["투어 예약은 어떻게 진행되나요?", "예약 확정 후 일정 변경이 가능한가요?"],
  환불: ["환불 규정은 어떻게 되나요?", "환불은 얼마나 걸리나요?"],
  결제: ["어떤 결제 수단을 지원하나요?", "플랫폼 수수료는 얼마인가요?"],
  투어: ["투어 포함/불포함 사항은 어디서 확인하나요?", "투어 출발이 확정되지 않으면 어떻게 되나요?"],
  강사: ["강사 인증은 어떻게 이루어지나요?", "강사에게 문제가 있을 경우 어떻게 신고하나요?"],
  기타: ["기타 문의는 어디로 하나요?"],
};

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `msg-${idCounter}`;
}

/** FAQ 챗봇 + 실시간 상담원 전환 패널 (고객센터 "FAQ" 탭 내용). */
export function FaqChatPanel() {
  const [mode, setMode] = useState<ChatMode>("chatbot");
  const [messages, setMessages] = useState<DisplayMessage[]>([
    { id: nextId(), role: "bot", body: "안녕하세요! ALL BLUE 고객센터입니다. 아래 자주 묻는 질문을 선택하시거나, 직접 문의를 남겨주세요." },
  ]);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages.length]);

  const handleFaqClick = (chip: (typeof FAQ_CHIPS)[number]) => {
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", body: chip.label },
      { id: nextId(), role: "bot", body: chip.answer },
    ]);
  };

  const handleEscalate = () => {
    setMode("live_agent");
    setMessages([
      { id: nextId(), role: "system", body: "ALL BLUE 전담 상담원이 연결되었습니다. 문의 사항을 남겨주시면 실시간으로 답변해 드립니다." },
    ]);
  };

  const handleSend = () => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { id: nextId(), role: "user", body: text.trim() }]);
    setText("");
  };

  return (
    <div className="flex flex-col">
      <div className="space-y-2 px-1 pb-3">
        <Accordion type="single" collapsible>
          {SUPPORT_FAQ_CATEGORIES.map((category) => (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="text-sm font-medium text-foreground">{category}</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  {FAQ_CATEGORY_ITEMS[category].map((q) => (
                    <li key={q}>· {q}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div ref={scrollRef} className="max-h-[360px] flex-1 space-y-3 overflow-y-auto rounded-xl border border-border bg-card/60 px-3 py-4">
        {messages.map((msg) => {
          if (msg.role === "system") {
            return (
              <div
                key={msg.id}
                className="mx-auto max-w-[90%] break-keep rounded-xl border border-primary/30 bg-secondary/60 px-3 py-2 text-center text-xs font-medium text-foreground"
              >
                {msg.body}
              </div>
            );
          }
          const mine = msg.role === "user";
          return (
            <div key={msg.id} className={cn("flex gap-2", mine ? "flex-row-reverse" : "flex-row")}>
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className={cn(!mine && "bg-primary text-primary-foreground")}>
                  {mine ? "나" : msg.role === "agent" ? "상" : <Bot className="h-3.5 w-3.5" />}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "max-w-[75%] break-keep rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                )}
              >
                {msg.body}
              </div>
            </div>
          );
        })}
      </div>

      {mode === "chatbot" && (
        <div className="space-y-3 pt-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {FAQ_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleFaqClick(chip)}
                className="break-keep rounded-lg border border-primary/30 bg-secondary/50 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
              >
                {chip.label}
              </button>
            ))}
          </div>
          <Button
            variant="destructive"
            size="lg"
            className="w-full gap-2 whitespace-normal break-keep py-3 text-sm"
            onClick={handleEscalate}
          >
            <MessageSquareWarning className="h-4 w-4 shrink-0" />
            해결이 안 되셨나요? 실시간 상담원 직접 연결
          </Button>
        </div>
      )}

      {mode === "live_agent" && (
        <div className="pt-3">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-primary" />
            실시간 상담원 연결됨
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="문의 내용을 입력하세요"
            />
            <Button size="icon" onClick={handleSend} aria-label="전송">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
