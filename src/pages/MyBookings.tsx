import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { BookingHistoryList } from "@/components/mypage/BookingHistoryList";
import { useRole } from "@/contexts/RoleContext";

// 다이버 마이페이지에 있던 "내 예약 내역"(상태 필터 탭 포함)을 하단 네비게이션의
// "내 예약"으로 통합했다. 필터/후기/문의/취소 등 모든 기능은 BookingHistoryList가 그대로 담당한다.
const MyBookings = () => {
  const { currentDiverId } = useRole();

  return (
    <div className="min-h-full bg-gradient-surface pb-24">
      <AppHeader title="내 예약" />
      <main className="mx-auto w-full max-w-md px-4 py-6 md:max-w-lg">
        <h1 className="mb-3 text-lg font-bold text-foreground">내 예약</h1>
        <BookingHistoryList diverId={currentDiverId} />
      </main>
      <BottomNav />
    </div>
  );
};

export default MyBookings;
