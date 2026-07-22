import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ChatThread } from "@/components/chat/ChatThread";
import { useAppData } from "@/contexts/AppDataContext";
import { isChatAccessible } from "@/lib/chatRetention";
import { cn } from "@/lib/utils";

interface InstructorChatPanelProps {
  instructorId: string;
}

/**
 * 강사 전용 채팅 패널 — 좌측에 담당 투어별 채널 목록, 우측(모바일에서는 아래)에 선택한 투어의
 * 그룹채팅(ChatThread)을 표시한다. 투어 종료 48시간 경과 시 채팅방은 자동으로 접근이 차단된다.
 */
export function InstructorChatPanel({ instructorId }: InstructorChatPanelProps) {
  const { tours, bookings } = useAppData();
  const myTours = tours.filter((t) => t.instructorId === instructorId);
  const [selectedTourId, setSelectedTourId] = useState<string | undefined>(myTours[0]?.id);
  const selectedTour = myTours.find((t) => t.id === selectedTourId);

  if (myTours.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">개설한 투어가 없습니다. 투어를 생성하면 채팅방이 자동으로 열립니다.</p>
    );
  }

  return (
    <div className="space-y-3">
      {/* 보관 정책 안내는 ChatThread 내부에 이미 표시되므로 여기서는 중복 표시하지 않는다. */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr]">
        <div className="space-y-1.5 overflow-x-auto md:overflow-visible">
          <div className="flex gap-1.5 md:flex-col">
            {myTours.map((tour) => {
              const participantCount = bookings.filter(
                (b) => b.tourId === tour.id && b.status === "confirmed",
              ).length;
              const accessible = isChatAccessible(tour);
              const active = tour.id === selectedTourId;
              return (
                <button
                  key={tour.id}
                  type="button"
                  onClick={() => setSelectedTourId(tour.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg border p-2.5 text-left text-xs transition-colors md:w-full",
                    active ? "border-primary bg-secondary" : "border-border bg-card hover:bg-secondary/50",
                    !accessible && "opacity-50",
                  )}
                >
                  <MessageCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 font-medium text-foreground">{tour.title}</span>
                    <span className="block text-[10px] text-muted-foreground">참가자 {participantCount}명</span>
                  </span>
                  {!accessible && (
                    <Badge variant="secondary" className="shrink-0 text-[9px]">
                      만료
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {selectedTour ? (
            <ChatThread tourId={selectedTour.id} tour={selectedTour} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">채팅방을 선택해주세요.</p>
          )}
        </div>
      </div>
    </div>
  );
}
