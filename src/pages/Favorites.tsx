import { Link } from "react-router-dom";
import { Bookmark, Star } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TourCard } from "@/components/search/TourCard";
import { VerifiedBadge } from "@/components/tour/VerifiedBadge";
import { useAppData } from "@/contexts/AppDataContext";
import { isTourBookable } from "@/lib/tourBooking";
import { pickFavoriteBadge } from "@/lib/favoriteBadge";
import { useDiverNotifications } from "@/hooks/useTourAlerts";
import type { DiverNotification } from "@/types/alerts";
import { FavoriteStatusBadge } from "@/components/alerts/FavoriteStatusBadge";

/** 위시리스트의 "찜한 강사" 카드 — 검색 결과의 TourCard와 톤을 맞춘 간단한 요약 카드. */
function BookmarkedInstructorCard({ instructorId }: { instructorId: string }) {
  const { getInstructorById, toggleInstructorBookmark } = useAppData();
  const instructor = getInstructorById(instructorId);
  if (!instructor) return null;

  return (
    <Card className="accent-top-ocean overflow-hidden border-border">
      <CardContent className="flex items-center gap-3 p-4">
        <Link to={`/instructor/${instructor.id}/profile`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar className="h-12 w-12 shrink-0 border border-border">
            <AvatarImage src={instructor.avatarUrl} alt={instructor.name} />
            <AvatarFallback className="bg-primary text-sm text-primary-foreground">
              {instructor.name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-foreground">{instructor.name} 강사</span>
              {instructor.agency && (
                <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[9px]">
                  {instructor.agency}
                </Badge>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              {instructor.verified && <VerifiedBadge />}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-warning text-warning" />
                {instructor.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => toggleInstructorBookmark(instructor.id)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-secondary"
          aria-label="찜 해제"
        >
          <Bookmark className="h-4 w-4 fill-primary text-primary" />
        </button>
      </CardContent>
    </Card>
  );
}

/** 찜한 투어 카드 위의 상태 배지 (모집 마감 · 마감 임박). 배지가 없으면 아무것도 그리지 않는다. */
/** 예약할 수 없는 이유 한 줄 (취소 > 모집 마감 > 만석 순). */
function unavailableReason(tour: { cancelledAt?: string; status: string; maxParticipants: number }, confirmed: number): string {
  if (tour.cancelledAt) return "취소된 투어";
  if (tour.status === "closed") return "모집 마감";
  if (confirmed >= tour.maxParticipants) return "만석";
  return "예약 불가";
}

/** 목록은 최신순이라 같은 종류의 첫 항목이 가장 최근 알림이다. */
function latestNotificationAt(notifications: DiverNotification[], tourId: string, kind: DiverNotification["kind"]) {
  return notifications.find((n) => n.tourId === tourId && n.kind === kind)?.createdAt;
}

function FavoriteTourBadge({ tourId, notifications }: { tourId: string; notifications: DiverNotification[] }) {
  const { getTourById, getConfirmedParticipantCount } = useAppData();
  const tour = getTourById(tourId);
  if (!tour) return null;
  const badge = pickFavoriteBadge({
    status: tour.status,
    maxParticipants: tour.maxParticipants,
    confirmedCount: getConfirmedParticipantCount(tour.id),
    seatOpenedAt: latestNotificationAt(notifications, tour.id, "seat_opened"),
    priceDropAt: latestNotificationAt(notifications, tour.id, "price_drop"),
  });
  if (!badge) return null;
  return <FavoriteStatusBadge badge={badge} />;
}

const Favorites = () => {
  const { tours, bookmarkedTourIds, bookmarkedInstructorIds, getConfirmedParticipantCount } = useAppData();
  const { data: notifications = [] } = useDiverNotifications();
  // 관리자가 정지·보류한 투어는 찜 목록에서도 숨긴다.
  // 마감·만석·취소된 투어는 "지금은 예약할 수 없어요" 구역에 흐리게 남겨, 찜했던 투어가 사라지지 않게 한다.
  const favoriteTours = tours.filter((t) => bookmarkedTourIds.includes(t.id) && !t.adminStatus);
  const bookmarkedTours = favoriteTours.filter((t) => isTourBookable(t) && getConfirmedParticipantCount(t.id) < t.maxParticipants);
  const unavailableTours = favoriteTours.filter((t) => !bookmarkedTours.includes(t));

  return (
    <div className="min-h-full bg-gradient-surface pb-20 md:pb-12">
      <AppHeader title="위시리스트" />
      <main className="mx-auto w-full max-w-md space-y-4 px-4 py-6 md:max-w-6xl md:px-6">
        <h1 className="text-lg font-bold text-foreground">위시리스트</h1>
        <Tabs defaultValue="tours">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tours">찜한 투어 ({favoriteTours.length})</TabsTrigger>
            <TabsTrigger value="instructors">찜한 강사 ({bookmarkedInstructorIds.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="tours" className="pt-3">
            {bookmarkedTours.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">찜한 투어가 없습니다.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
                {bookmarkedTours.map((tour) => (
                  <div key={tour.id} className="space-y-2">
                    <FavoriteTourBadge tourId={tour.id} notifications={notifications} />
                    <TourCard tour={tour} />
                  </div>
                ))}
              </div>
            )}
            {unavailableTours.length > 0 && (
              <section className="mt-8 space-y-3" aria-label="지금은 예약할 수 없는 찜 투어">
                <h2 className="text-[16px] font-semibold text-foreground">지금은 예약할 수 없어요</h2>
                <div className="grid grid-cols-1 gap-4 opacity-60 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
                  {unavailableTours.map((tour) => (
                    <div key={tour.id} className="space-y-2">
                      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-[13px] font-semibold text-muted-foreground">
                        {unavailableReason(tour, getConfirmedParticipantCount(tour.id))}
                      </span>
                      <TourCard tour={tour} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </TabsContent>
          <TabsContent value="instructors" className="pt-3">
            {bookmarkedInstructorIds.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">찜한 강사가 없습니다.</p>
            ) : (
              <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 lg:grid-cols-3">
                {bookmarkedInstructorIds.map((id) => (
                  <BookmarkedInstructorCard key={id} instructorId={id} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <BottomNav />
    </div>
  );
};

export default Favorites;
