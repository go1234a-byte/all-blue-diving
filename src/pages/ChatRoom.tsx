import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, MessageCircleOff, Users } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatThread } from "@/components/chat/ChatThread";
import { ChatParticipantList } from "@/components/chat/ChatParticipantList";
import { RoomAssignmentDashboard } from "@/components/chat/RoomAssignmentDashboard";
import { TourInfoPinnedBanner } from "@/components/chat/TourInfoPinnedBanner";
import { TourDashboardTab } from "@/components/chat/TourDashboardTab";
import { TourItineraryTab } from "@/components/chat/TourItineraryTab";
import { TourMoreInfoTab } from "@/components/chat/TourMoreInfoTab";
import { VerifiedBadge } from "@/components/tour/VerifiedBadge";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { markChatRead } from "@/lib/chatReadState";
import type { InstructorProfile } from "@/types";

/** 그룹채팅 전용 화면(?view=chat) 상단에 담당 강사 프로필과 참가자 수를 요약해서 보여준다. */
function ChatHeaderSummary({
  instructor,
  instructorId,
  confirmedCount,
  maxParticipants,
  onOpenParticipants,
}: {
  instructor?: InstructorProfile;
  instructorId: string;
  confirmedCount: number;
  maxParticipants: number;
  onOpenParticipants: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
      <Link to={`/instructor/${instructorId}/profile`} className="flex min-w-0 flex-1 items-center gap-2">
        <Avatar className="h-8 w-8 shrink-0 border border-border">
          <AvatarImage src={instructor?.avatarUrl} alt={instructor?.name} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {instructor?.name?.[0] ?? "강"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="line-clamp-1 text-sm font-semibold text-foreground">{instructor?.name ?? "강사"} 강사</p>
            {instructor?.verified && <VerifiedBadge size="sm" />}
          </div>
          <p className="text-xs text-muted-foreground">담당 강사 · 프로필 보기</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={onOpenParticipants}
        className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary/70"
      >
        <Users className="h-3.5 w-3.5" />
        {confirmedCount}/{maxParticipants}명
      </button>
    </div>
  );
}

const ChatRoom = () => {
  const { tourId } = useParams();
  const [searchParams] = useSearchParams();
  // 하단 "채팅" 탭에서 들어온 경우(?view=chat)에는 그룹채팅만 보여주고,
  // 대시보드/일정/참가자/더보기 탭은 "내 예약"에서 투어카드를 눌러 들어왔을 때만 노출한다.
  const chatOnly = searchParams.get("view") === "chat";
  const { tours, bookings, getInstructorById, toursLoading, getConfirmedParticipantCount, fetchMaskedTourParticipants } =
    useAppData();
  const { role, currentInstructorId, currentDiverId, profile } = useRole();
  const tour = tours.find((t) => t.id === tourId);
  const instructor = tour ? getInstructorById(tour.instructorId) : undefined;
  const [tab, setTab] = useState("dashboard");
  const [participantsOpen, setParticipantsOpen] = useState(false);

  const tourBookings = bookings.filter((b) => b.tourId === tourId);
  // 취소한 참가자는 채팅방 참가자 목록/룸 배정에서 더 이상 보이면 안 되므로 별도로 걸러둔다.
  const activeTourBookings = tourBookings.filter((b) => b.status !== "cancelled");
  // 담당 강사 본인이거나, 관리자 계정이면 참가자 실명 확인/방 배정 수정/예약 취소 등 강사와 동일한 권한을 준다.
  const isTourOwnerInstructor = !!tour && !!currentInstructorId && tour.instructorId === currentInstructorId;
  const isInstructor = isTourOwnerInstructor || role === "admin";
  const myBooking = tourBookings.find((b) => b.diverId === currentDiverId);

  // bookings 배열은 RLS 때문에 본인/담당 강사/관리자 예약만 담겨 있어서, 강사·관리자가
  // 아닌 일반 참가자에게는 다른 참가자가 안 보이는 문제가 있었다. 강사/관리자는 기존처럼
  // activeTourBookings(실명 포함)를 그대로 쓰고, 일반 참가자는 서버에서 이름이 이미
  // 마스킹된 상태로 내려오는 별도 목록을 채팅방 진입 시 가져와서 대신 사용한다.
  const [maskedParticipants, setMaskedParticipants] = useState<typeof activeTourBookings>([]);
  useEffect(() => {
    if (!tour || isInstructor) return;
    let active = true;
    (async () => {
      const rows = await fetchMaskedTourParticipants(tour.id);
      if (active) setMaskedParticipants(rows);
    })();
    return () => {
      active = false;
    };
  }, [tour?.id, isInstructor, fetchMaskedTourParticipants]);

  const participantDisplayBookings = isInstructor ? activeTourBookings : maskedParticipants;

  // 채팅 목록(ChatList)에서 "안 읽음" 뱃지/정렬에 쓸 수 있게, 이 채팅방을 실제로 열어본
  // 시점을 계정별로 기록해둔다 — 서버에 읽음 상태를 저장하는 컬럼이 없어 클라이언트에서만
  // 계산하는 구조라, 열람 시점 이후에 남이 보낸 메시지가 있으면 안 읽은 것으로 간주한다.
  useEffect(() => {
    if (!tour || !profile?.id) return;
    markChatRead(profile.id, tour.id);
  }, [tour?.id, profile?.id]);

  if (toursLoading && !tour) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 bg-gradient-surface p-6 text-center">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 bg-gradient-surface p-6 text-center">
        <MessageCircleOff className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">채팅방을 찾을 수 없습니다.</p>
        <Link to="/chat" className="text-sm font-medium text-primary underline underline-offset-4">
          채팅 목록으로 돌아가기
        </Link>
        <BottomNav />
      </div>
    );
  }

  if (chatOnly) {
    return (
      <div className="min-h-full bg-gradient-surface pb-20">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur">
          <Link to="/chat" className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="line-clamp-1 text-base font-semibold text-foreground">{tour.title}</h1>
        </header>
        <main className="mx-auto w-full max-w-md space-y-2 px-4 py-4 md:max-w-lg">
          <ChatHeaderSummary
            instructor={instructor}
            instructorId={tour.instructorId}
            confirmedCount={getConfirmedParticipantCount(tour.id)}
            maxParticipants={tour.maxParticipants}
            onOpenParticipants={() => setParticipantsOpen(true)}
          />
          <TourInfoPinnedBanner tour={tour} />
          {tour.instructorNotice && (
            <div className="rounded-lg border border-primary/40 bg-secondary/60 px-3 py-2 text-xs text-foreground">
              <span className="font-semibold text-primary">📌 강사 공지 </span>
              {tour.instructorNotice}
            </div>
          )}
          <ChatThread tourId={tour.id} tour={tour} />
        </main>
        <Sheet open={participantsOpen} onOpenChange={setParticipantsOpen}>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
            <SheetHeader>
              <SheetTitle>참가자 목록</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              {/* 강사(및 관리자)는 실명을 그대로 보고, 다이버는 담당 강사 이름만 실명이고
                  다른 참가자 이름은 중간 글자를 *로 가려서(예: 김*태) 확인한다. */}
              <ChatParticipantList
                bookings={participantDisplayBookings}
                instructorId={tour.instructorId}
                instructorName={instructor?.name}
                isInstructor={isInstructor}
                isAdmin={role === "admin"}
                tour={tour}
              />
              {/* "참가자" 탭(마이페이지→투어카드로 들어왔을 때)과 동일하게, 참가자 목록
                  바로 아래에 방배정 현황을 이어서 보여준다 — 다이버는 방 번호만 확인하고,
                  강사(및 관리자)는 "성별/선호 기준 자동 배정" 버튼과 방 번호 직접 수정
                  입력창까지 그대로 쓸 수 있다(RoomAssignmentDashboard 내부에서 isInstructor로
                  이미 분기 처리됨). 하단 "채팅" 탭으로 들어온 경우에는 이 화면이 없어서
                  강사가 방배정을 하려면 항상 마이페이지를 거쳐야 했던 불편을 없앤다. */}
              <RoomAssignmentDashboard bookings={participantDisplayBookings} isInstructor={isInstructor} />
            </div>
          </SheetContent>
        </Sheet>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-surface pb-20">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur">
        <Link to="/chat" className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="line-clamp-1 text-base font-semibold text-foreground">{tour.title}</h1>
      </header>
      <main className="mx-auto w-full max-w-md px-4 py-4 md:max-w-lg">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="text-xs">대시보드</TabsTrigger>
            <TabsTrigger value="itinerary" className="text-xs">일정</TabsTrigger>
            <TabsTrigger value="participants" className="text-xs">참가자</TabsTrigger>
            <TabsTrigger value="more" className="text-xs">더보기</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="pt-3">
            <TourDashboardTab tour={tour} bookings={activeTourBookings} isInstructor={isInstructor} />
          </TabsContent>
          <TabsContent value="itinerary" className="pt-3">
            <TourItineraryTab tour={tour} isInstructor={isInstructor} />
          </TabsContent>
          <TabsContent value="participants" className="space-y-4 pt-3">
            <ChatParticipantList
              bookings={participantDisplayBookings}
              instructorId={tour.instructorId}
              instructorName={instructor?.name}
              isInstructor={isInstructor}
              isAdmin={role === "admin"}
              tour={tour}
            />
            <RoomAssignmentDashboard bookings={participantDisplayBookings} isInstructor={isInstructor} />
          </TabsContent>
          <TabsContent value="more" className="pt-3">
            <TourMoreInfoTab tour={tour} bookings={activeTourBookings} myBooking={myBooking} isInstructor={isInstructor} />
          </TabsContent>
        </Tabs>
      </main>
      <BottomNav />
    </div>
  );
};

export default ChatRoom;
