import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, MessageCircleQuestion, ShieldAlert } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { countUnread } from "@/lib/chatReadState";
import { isChatAccessible } from "@/lib/chatRetention";
import { formatDateKR } from "@/lib/dates";
import { handleImageFallback, IMAGE_PLACEHOLDER } from "@/lib/image";
import { cn } from "@/lib/utils";
import type { Tour } from "@/types";

type ChatSortMode = "recent" | "unread" | "departure";

const SORT_OPTIONS: { value: ChatSortMode; label: string }[] = [
  { value: "recent", label: "최신순" },
  { value: "unread", label: "안읽음순" },
  { value: "departure", label: "출발임박순" },
];

const CHAT_SORT_STORAGE_KEY = "allblue-chat-sort-mode";

// role은 MasterRole("public"|"instructor"|"admin")이며 다이버는 "public"으로 매핑된다.
const EMPTY_MESSAGE: Record<string, string> = {
  public: "예약한 투어가 없습니다. 투어를 예약하면 그룹채팅이 열립니다.",
  instructor: "개설한 투어가 없습니다. 투어를 개설하면 그룹채팅이 열립니다.",
  admin: "등록된 투어가 없습니다.",
};

const ChatList = () => {
  const { role, currentDiverId, currentInstructorId, profile, authLoading } = useRole();
  const { tours, bookings, chatMessages, supportTickets } = useAppData();
  const [sortMode, setSortMode] = useState<ChatSortMode>(() => {
    if (typeof window === "undefined") return "recent";
    const stored = window.localStorage.getItem(CHAT_SORT_STORAGE_KEY);
    return stored === "recent" || stored === "unread" || stored === "departure" ? stored : "recent";
  });

  const changeSortMode = (mode: ChatSortMode) => {
    setSortMode(mode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CHAT_SORT_STORAGE_KEY, mode);
    }
  };

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
      const unreadCount = countUnread(profile?.id, tour.id, tourMessages);
      return { tour, lastMessage, sortKey, unreadCount };
    })
    .sort((a, b) => {
      if (sortMode === "unread") {
        if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
        return a.sortKey < b.sortKey ? 1 : -1;
      }
      if (sortMode === "departure") {
        return a.tour.startDate < b.tour.startDate ? -1 : 1;
      }
      // "recent" (기본값): 최근 메시지(없으면 투어 출발일) 기준 최신순.
      return a.sortKey < b.sortKey ? 1 : -1;
    });

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
    <div className="min-h-full bg-gradient-surface pb-20 md:pb-12">
      <AppHeader title="채팅" />
      <main className="mx-auto w-full max-w-md space-y-2 px-4 py-4 md:max-w-3xl md:px-6">
        {/* 로그인 직후 session -> profiles 조회가 끝나기 전까지는 role이 아직 "public"이고
            currentDiverId/currentInstructorId도 비어있어, authLoading을 안 보면 실제로는
            채팅방이 있는데도 "채팅방 없음"이 잠깐 잘못 표시된다. MyPage와 동일하게 인증 확인
            중에는 로딩 상태만 보여준다. */}
        {authLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
            인증 정보를 확인하는 중...
          </div>
        ) : (
        <>
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
          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="text-xs font-medium text-muted-foreground">투어 그룹채팅</p>
            <div className="flex shrink-0 gap-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => changeSortMode(opt.value)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                    sortMode === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/70",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {rows.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">{EMPTY_MESSAGE[role]}</p>
        )}
        {rows.map(({ tour, lastMessage, unreadCount }) => {
          const accessible = isChatAccessible(tour);
          return (
            <Link
              key={tour.id}
              to={`/chat/${tour.id}?view=chat`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-secondary/40"
            >
              <img
                src={tour.mainImageUrl || IMAGE_PLACEHOLDER}
                alt={tour.title}
                onError={handleImageFallback}
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="line-clamp-1 text-sm font-semibold text-foreground">{tour.title}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    {unreadCount > 0 && (
                      <Badge className="h-5 min-w-5 justify-center rounded-full bg-destructive px-1.5 text-[10px] text-destructive-foreground">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                    {!accessible && (
                      <Badge variant="secondary" className="shrink-0 gap-1 text-[9px]">
                        <ShieldAlert className="h-2.5 w-2.5" />
                        보관기간 만료
                      </Badge>
                    )}
                  </div>
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
        </>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default ChatList;
