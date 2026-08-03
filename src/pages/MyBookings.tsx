import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { BookingHistoryList } from "@/components/mypage/BookingHistoryList";
import { useRole } from "@/contexts/RoleContext";

// 다이버 마이페이지에 있던 "내 예약 내역"(상태 필터 탭 포함)을 하단 네비게이션의
// "내 예약"으로 통합했다. 필터/후기/문의/취소 등 모든 기능은 BookingHistoryList가 그대로 담당한다.
const MyBookings = () => {
  const { currentDiverId, authLoading } = useRole();

  return (
    <div className="min-h-full bg-gradient-surface pb-24">
      <AppHeader title="내 예약" />
      <main className="mx-auto w-full max-w-md px-4 py-6 md:max-w-lg">
        <h1 className="mb-3 text-lg font-bold text-foreground">내 예약</h1>
        {/* 로그인 직후 session -> profiles 조회가 끝나기 전까지는 currentDiverId가 아직
            빈 문자열이라, authLoading을 안 보면 실제로는 예약이 있는데도 "예약 내역 없음"이
            잠깐 잘못 표시된다. MyPage와 동일하게 인증 확인 중에는 로딩 상태만 보여준다. */}
        {authLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
            인증 정보를 확인하는 중...
          </div>
        ) : (
          <BookingHistoryList diverId={currentDiverId} />
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default MyBookings;
