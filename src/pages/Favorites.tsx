import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { TourCard } from "@/components/search/TourCard";
import { useAppData } from "@/contexts/AppDataContext";

const Favorites = () => {
  const { tours, bookmarkedTourIds } = useAppData();
  const bookmarkedTours = tours.filter((t) => bookmarkedTourIds.includes(t.id));

  return (
    <div className="min-h-full bg-gradient-surface pb-20">
      <AppHeader title="찜한 투어" />
      <main className="mx-auto w-full max-w-md space-y-4 px-4 py-6 md:max-w-lg">
        <h1 className="text-lg font-bold text-foreground">찜한 투어</h1>
        {bookmarkedTours.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">찜한 투어가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {bookmarkedTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Favorites;
