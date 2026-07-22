import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueLineChart } from "@/components/admin/dashboard/RevenueLineChart";
import { CountryBookingBarChart } from "@/components/admin/dashboard/CountryBookingBarChart";
import { BookingStatusDonut } from "@/components/admin/dashboard/BookingStatusDonut";
import { useAppData } from "@/contexts/AppDataContext";
import { formatKRW } from "@/lib/pricing";

const AdminAnalyticsPage = () => {
  const { bookings, tours, instructors } = useAppData();

  const totalRevenue = bookings.reduce((sum, b) => sum + b.platformFee, 0);
  const avgBookingValue = bookings.length > 0 ? Math.round(
    bookings.reduce((sum, b) => sum + b.totalPaid, 0) / bookings.length,
  ) : 0;
  const avgRating = instructors.length > 0
    ? (instructors.reduce((sum, i) => sum + i.rating, 0) / instructors.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="accent-top-ocean">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">누적 플랫폼 수수료 매출</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-primary">{formatKRW(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="accent-top-ocean">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">평균 예약 결제금액</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-primary">{formatKRW(avgBookingValue)}</p>
          </CardContent>
        </Card>
        <Card className="accent-top-ocean">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">강사 평균 평점</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-primary">{avgRating}</p>
          </CardContent>
        </Card>
      </div>

      <RevenueLineChart />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BookingStatusDonut />
        <CountryBookingBarChart />
      </div>

      <p className="text-xs text-muted-foreground">등록 투어 총 {tours.length}개 기준 통계입니다.</p>
    </div>
  );
};

export default AdminAnalyticsPage;
