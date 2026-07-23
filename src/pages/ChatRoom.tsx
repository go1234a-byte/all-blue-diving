import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, MessageCircleOff, Users } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { InstructorProfile } from "@/types";

/** 그룹채팅 전용 화면(?view=chat) 상단에 담당 강사 프로필과 참가자 수를 요약해서 보여준다. */
function ChatHeaderSummary({
  instructor,
  instructorId,
  confirmedCount,
  maxParticipants,
}: {
  instructor?: InstructorProfile;
  instructorId: string;
  confirmedCount: number;
  maxParticipants: number;
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
      <div className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        {confirmedCount}/{maxParticipants}명
      </div>
    </div>
  );
}

const ChatRoom = () => {
  const { tourId } = useParams();
  const [searchParams] = useSearchParams();
  // 하단 "채팅" 탭에서 들어온 경우(?view=chat)에는 그룹채팅만 보여주고,
  // 대시보드/일정/참가자/더보기 탭은 "내 예약"에서 투어카드를 눌러 들어왔을 때만 노출한다.
  const chatOnly = searchParams.get("view") === "chat";
  const { tours, bookings, getInstructorById } = useAppData();
  const { role, currentInstructorId, currentDiverId } = useRole();
  const tour = tours.find((t) => t.id === tourId);
  const instructor = tour ? getInstructorById(tour.instructorId) : undefined;
  const [tab, setTab] = useState("dashboard");

  const tourBookings = bookings.filter((b) => b.tourId === tourId);
  // 취소한 참가자는 채팅방 참가자 목록/룸 배정에서 더 이상 보이면 안 되므로 별도로 걸러둔다.
  const activeTourBookings = tourBookings.filter((b) => b.status !== "cancelled");
  // 담당 강사 본인이거나, 관리자 계정이면 참가자 실명 확인/방 배정 수정/예약 취소 등 강사와 동일한 권한을 준다.
  const isTourOwnerInstructor = !!tour && !!currentInstructorId && tour.instructorId === currentInstructorId;
  const isInstructor = isTourOwnerInstructor || role === "admin";
  const myBooking = tourBookings.find((b) => b.diverId === currentDiverId);

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
            confirmedCount={activeTourBookings.filter((b) => b.status === "confirmed").length}
            maxParticipants={tour.maxParticipants}
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
              bookings={activeTourBookings}
              instructorId={tour.instructorId}
              instructorName={instructor?.name}
              isInstructor={isInstructor}
              tour={tour}
            />
            <RoomAssignmentDashboard bookings={activeTourBookings} isInstructor={isInstructor} />
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
