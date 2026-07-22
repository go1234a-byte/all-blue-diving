import { Link } from "react-router-dom";
import { MessageCircle, MessageCircleQuestion, ShieldAlert } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { isChatAccessible } from "@/lib/chatRetention";
import { formatDateKR } from "@/lib/dates";
import type { Tour } from "@/types";

// role은 MasterRole("public"|"instructor"|"admin")이며 다이버는 "public"으로 매핑된다.
const EMPTY_MESSAGE: Record<string, string> = {
  public: "예약한 투어가 없습니다. 투어를 예약하면 그룹채팅이 열립니다.",
  instructor: "개설한 투어가 없습니다. 투어를 개설하면 그룹채팅이 열립니다.",
  admin: "등록된 투어가 없습니다.",
};

const ChatList = () => {
  const { role, currentDiverId, currentInstructorId } = useRole();
  const { tours, bookings, chatMessages, supportTickets } = useAppData();

  let targetTours: Tour[];
  if (role === "instructor") {
    targetTours = tours.filter((t) => t.instructorId === currentInstructorId);
  } else if (role === "admin") {
    targetTours = tours;
  } else {
    const myTourIds = new Set(
      bookings.filter((b) => b.diverId === currentDiverId && b.status !== "cancelled").map((b) => b.tourId),
    );
    targetTours = tours.filter((t) => myTourIds.has(t.id));
  }

  const rows = targetTours
    .map((tour) => {
      const tourMessages = chatMessages.filter((m) => m.tourId === tour.id);
      const lastMessage = tourMessages[tourMessages.length - 1];
      const sortKey = lastMessage?.createdAt ?? tour.startDate;
      return { tour, lastMessage, sortKey };
    })
    .sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1));

  // 플랫폼 고객센터(1:1 문의/분쟁조정/신고)도 투어 그룹채팅과 같은 "채팅" 탭 안에서
  // 하나의 목록으로 합쳐서 보여준다. 다이버에게만 노출한다.
  const myTickets =
    role === "public" && currentDiverId
      ? supportTickets
          .filter((t) => t.userId === currentDiverId)
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      : [];
  const latestTicket = myTickets[0];

  return (
    <div className="min-h-full bg-gradient-surface pb-20">
      <AppHeader title="채팅" />
      <main className="mx-auto w-full max-w-md space-y-2 px-4 py-4 md:max-w-lg">
        {role === "public" && (
          <Link
            to="/support"
            className="flex items-center gap-3 rounded-xl border border-primary/30 bg-secondary/40 p-3 transition-colors hover:bg-secondary"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <MessageCircleQuestion className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">고객센터</p>
                {latestTicket && (
                  <Badge
                    variant={latestTicket.status === "답변완료" ? "default" : "secondary"}
                    className="shrink-0 text-[9px]"
                  >
                    {latestTicket.status}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">1:1 문의 · 분쟁조정 · 신고</p>
              {latestTicket ? (
                <p className="line-clamp-1 text-xs text-muted-foreground">{latestTicket.content}</p>
              ) : (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageCircle className="h-3 w-3" />
                  궁금한 점을 문의해보세요
                </p>
              )}
            </div>
          </Link>
        )}

        {rows.length > 0 && (
          <p className="pt-1 text-xs font-medium text-muted-foreground">투어 그룹채팅</p>
        )}
        {rows.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">{EMPTY_MESSAGE[role]}</p>
        )}
        {rows.map(({ tour, lastMessage }) => {
          const accessible = isChatAccessible(tour);
          return (
            <Link
              key={tour.id}
              to={`/chat/${tour.id}?view=chat`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-secondary/40"
            >
              <img
                src={tour.mainImageUrl}
                alt={tour.title}
                crossOrigin="anonymous"
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="line-clamp-1 text-sm font-semibold text-foreground">{tour.title}</p>
                  {!accessible && (
                    <Badge variant="secondary" className="shrink-0 gap-1 text-[9px]">
                      <ShieldAlert className="h-2.5 w-2.5" />
                      보관기간 만료
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{tour.country} · {tour.site}</p>
                {lastMessage ? (
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{lastMessage.senderName}</span>
                    {": "}
                    {lastMessage.body}
                  </p>
                ) : (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle className="h-3 w-3" />
                    아직 대화가 없습니다 · {formatDateKR(tour.startDate)} 출발
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </main>
      <BottomNav />
    </div>
  );
};

export default ChatList;
