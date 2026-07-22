import { Link } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/contexts/AppDataContext";
import { formatKRW } from "@/lib/pricing";
import { handleImageFallback, IMAGE_PLACEHOLDER } from "@/lib/image";
import type { BookingStatus } from "@/types";

const STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: "예약확정",
  cancelled: "취소됨",
  cancel_pending_review: "취소 심사중",
};

const STATUS_VARIANT: Record<BookingStatus, "default" | "destructive" | "secondary"> = {
  confirmed: "default",
  cancelled: "destructive",
  cancel_pending_review: "secondary",
};

const MyBookings = () => {
  const { bookings, getTourById } = useAppData();

  return (
    <div className="min-h-full bg-gradient-surface pb-20">
      <AppHeader title="내 예약" />
      <main className="mx-auto w-full max-w-md space-y-3 px-4 py-6 md:max-w-lg">
        <h1 className="text-lg font-bold text-foreground">내 예약</h1>
        {bookings.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">예약 내역이 없습니다.</p>
        )}
        {bookings.map((booking) => {
          const tour = getTourById(booking.tourId);
          if (!tour) return null;
          return (
            <Link key={booking.id} to={`/chat/${tour.id}`}>
              <Card className="transition-shadow hover:shadow-ocean">
                <CardContent className="flex gap-3 p-4">
                  <img
                    src={tour.mainImageUrl || IMAGE_PLACEHOLDER}
                    alt={tour.title}
                    onError={handleImageFallback}
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="line-clamp-1 text-sm font-semibold text-foreground">{tour.title}</p>
                      <Badge variant={STATUS_VARIANT[booking.status]}>{STATUS_LABEL[booking.status]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{tour.country} · {tour.site}</p>
                    <p className="text-sm font-bold text-primary">{formatKRW(booking.totalPaid)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </main>
      <BottomNav />
    </div>
  );
};

export default MyBookings;
