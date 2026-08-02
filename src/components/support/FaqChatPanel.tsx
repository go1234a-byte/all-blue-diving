import { useEffect, useRef, useState } from "react";
import { Bot, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SUPPORT_FAQ_CATEGORIES } from "@/types";
import { cn } from "@/lib/utils";

interface DisplayMessage {
  id: string;
  role: "bot" | "system" | "user";
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

const FAQ_CATEGORY_ITEMS: Record<(typeof SUPPORT_FAQ_CATEGORIES)[number], { q: string; a: string }[]> = {
  예약: [
    {
      q: "투어 예약은 어떻게 진행되나요?",
      a: "원하시는 투어 상세 페이지에서 옵션을 선택하고 결제를 완료하면 예약이 접수됩니다. 최소 인원 충족 시 예약이 확정되며, 확정 결과는 마이페이지와 알림으로 안내됩니다.",
    },
    {
      q: "예약 확정 후 일정 변경이 가능한가요?",
      a: "예약 확정 후 일정 변경은 원칙적으로 불가하며, 부득이한 경우 마이페이지 > 내 예약 내역에서 취소 후 재예약을 진행해주셔야 합니다. 취소 시점에 따라 환불 규정이 적용됩니다.",
    },
    {
      q: "최소 인원 미달 시 예약은 어떻게 되나요?",
      a: "모집 마감 시점까지 최소 인원이 채워지지 않으면 투어별 정책(진행/취소)에 따라 처리되며, 취소되는 경우 결제 금액은 전액 환불됩니다.",
    },
  ],
  환불: [
    {
      q: "환불 규정은 어떻게 되나요?",
      a: "출발일 기준 환불 규정에 따라 환불 비율이 달라집니다(예: 30일 전 전액, 14일 전 70%, 7일 전 50% 등 투어별 상세 규정은 투어 상세 페이지에서 확인 가능). 최소 인원 미달로 인한 투어 취소는 전액 환불됩니다.",
    },
    {
      q: "환불은 얼마나 걸리나요?",
      a: "카드 결제 취소 및 환불은 카드사 정책에 따라 실제 반영까지 영업일 기준 3~7일 정도 소요될 수 있습니다.",
    },
    {
      q: "환불 신청은 어디서 하나요?",
      a: "마이페이지 > 내 예약 내역에서 해당 예약을 선택해 취소를 신청하시면 됩니다. 불가피한 사유(의료·천재지변 등)는 증빙서류를 첨부하시면 운영팀 심사 후 규정 외 환불 여부가 결정됩니다.",
    },
  ],
  결제: [
    {
      q: "어떤 결제 수단을 지원하나요?",
      a: "신용/체크카드, 실시간 계좌이체 등 Toss Payments를 통한 다양한 결제 수단을 지원합니다.",
    },
    {
      q: "플랫폼 수수료는 얼마인가요?",
      a: "ALL BLUE는 투어 기본 금액과 선택 옵션 금액 합계의 10%를 플랫폼 이용 수수료로 결제 시점에 함께 청구합니다. 자세한 내역은 체크아웃 영수증에서 확인하실 수 있습니다.",
    },
    {
      q: "현장에서 추가로 결제해야 하는 금액이 있나요?",
      a: "투어별로 현장 결제 잔액(온사이트 밸런스)이 있는 경우 투어 상세 페이지와 예약 내역에 명시되며, 현지 통화 또는 안내된 방식으로 강사/센터에 직접 결제합니다.",
    },
  ],
  투어: [
    {
      q: "투어 포함/불포함 사항은 어디서 확인하나요?",
      a: "투어 상세 페이지 하단의 '포함/불포함' 섹션에서 확인하실 수 있으며, 강사가 추천하는 준비물도 함께 안내됩니다.",
    },
    {
      q: "투어 출발이 확정되지 않으면 어떻게 되나요?",
      a: "최소 인원 미달로 출발이 확정되지 않는 경우 결제 금액은 전액 환불되며, 관련 안내는 알림과 이메일로 발송됩니다.",
    },
    {
      q: "투어 일정이나 집합 장소는 어디서 확인하나요?",
      a: "예약 완료 후 참가자 대시보드의 '일정' 탭에서 일자별 세부 일정과 집합 장소/시간을 확인할 수 있습니다.",
    },
  ],
  강사: [
    {
      q: "강사 인증은 어떻게 이루어지나요?",
      a: "강사 가입 시 자격증(라이선스) 서류 제출과 플랫폼 서약서 서명을 거치며, 운영팀 검토 후 '플랫폼 인증강사' 배지가 부여됩니다.",
    },
    {
      q: "강사에게 문제가 있을 경우 어떻게 신고하나요?",
      a: "투어 상세 페이지 또는 채팅방 내 신고 기능을 통해 신고하실 수 있으며, 접수된 신고는 운영팀이 확인 후 조치합니다.",
    },
  ],
  기타: [
    {
      q: "기타 문의는 어디로 하나요?",
      a: "위 카테고리에서 답을 찾지 못하셨다면 아래 '문의 남기기' 버튼을 눌러 1:1 문의를 남겨주세요. 24시간 이내에 답변드립니다.",
    },
  ],
};

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `msg-${idCounter}`;
}

interface FaqChatPanelProps {
  /** "문의 남기기" 버튼 클릭 시 호출 — 실제 접수가 이뤄지는 1:1 문의 탭으로 이동시킨다.
      (예전에는 이 버튼을 누르면 아무 데도 접수되지 않는 가짜 실시간 채팅 화면으로만
      전환되어, 사용자가 입력한 문의 내용이 그대로 사라지는 문제가 있었다.) */
  onRequestInquiry: () => void;
}

/** FAQ 챗봇 패널 (고객센터 "FAQ" 탭 내용). 자주 묻는 질문으로 해결되지 않으면
    실제로 접수되는 1:1 문의 탭으로 안내한다. */
export function FaqChatPanel({ onRequestInquiry }: FaqChatPanelProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    { id: nextId(), role: "bot", body: "안녕하세요! ALL BLUE 고객센터입니다. 아래 자주 묻는 질문을 선택하시거나, 직접 문의를 남겨주세요." },
  ]);
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

  return (
    <div className="flex flex-col">
      <div className="space-y-2 px-1 pb-3">
        <Accordion type="single" collapsible>
          {SUPPORT_FAQ_CATEGORIES.map((category) => (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="text-sm font-medium text-foreground">{category}</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-3 text-xs">
                  {FAQ_CATEGORY_ITEMS[category].map((item) => (
                    <li key={item.q} className="space-y-1">
                      <p className="font-semibold text-foreground">Q. {item.q}</p>
                      <p className="break-keep leading-relaxed text-muted-foreground">A. {item.a}</p>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div ref={scrollRef} className="max-h-[360px] flex-1 space-y-3 overflow-y-auto rounded-xl border border-border bg-card/60 px-3 py-4">
        {messages.map((msg) => {
          const mine = msg.role === "user";
          return (
            <div key={msg.id} className={cn("flex gap-2", mine ? "flex-row-reverse" : "flex-row")}>
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className={cn(!mine && "bg-primary text-primary-foreground")}>
                  {mine ? "나" : <Bot className="h-3.5 w-3.5" />}
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
        <div className="space-y-1.5">
          <Button
            variant="destructive"
            size="lg"
            className="w-full gap-2 whitespace-normal break-keep py-3 text-sm"
            onClick={onRequestInquiry}
          >
            <MessageSquareWarning className="h-4 w-4 shrink-0" />
            해결이 안 되셨나요? 문의 남기기
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">24시간 이내 응답</p>
        </div>
      </div>
    </div>
  );
}
