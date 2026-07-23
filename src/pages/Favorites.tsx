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

const Favorites = () => {
  const { tours, bookmarkedTourIds, bookmarkedInstructorIds } = useAppData();
  const bookmarkedTours = tours.filter((t) => bookmarkedTourIds.includes(t.id));

  return (
    <div className="min-h-full bg-gradient-surface pb-20">
      <AppHeader title="위시리스트" />
      <main className="mx-auto w-full max-w-md space-y-4 px-4 py-6 md:max-w-lg">
        <h1 className="text-lg font-bold text-foreground">위시리스트</h1>
        <Tabs defaultValue="tours">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tours">찜한 투어 ({bookmarkedTours.length})</TabsTrigger>
            <TabsTrigger value="instructors">찜한 강사 ({bookmarkedInstructorIds.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="tours" className="pt-3">
            {bookmarkedTours.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">찜한 투어가 없습니다.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {bookmarkedTours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="instructors" className="space-y-3 pt-3">
            {bookmarkedInstructorIds.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">찜한 강사가 없습니다.</p>
            ) : (
              bookmarkedInstructorIds.map((id) => <BookmarkedInstructorCard key={id} instructorId={id} />)
            )}
          </TabsContent>
        </Tabs>
      </main>
      <BottomNav />
    </div>
  );
};

export default Favorites;
