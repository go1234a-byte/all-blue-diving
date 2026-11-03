import { useAppData } from "@/contexts/AppDataContext";
import { isTourBookable } from "@/lib/tourBooking";

/**
 * 홈 투어 카드의 위시리스트 하트. 카드 전체가 <Link>라서 클릭이 상세로 새지 않게 막는다.
 * 검색 카드(TourCard)와 같은 규칙: 예약 불가 투어는 새로 찜할 수 없다.
 */
export function WishButton({ tourId }: { tourId: string }) {
  const { isBookmarked, toggleBookmark, getTourById } = useAppData();
  const on = isBookmarked(tourId);
  const tour = getTourById(tourId);
  return (
    <button
      type="button"
      className={`ab-wish ${on ? "on" : ""}`}
      aria-label={on ? "위시리스트에서 빼기" : "위시리스트에 담기"}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!on && tour && !isTourBookable(tour)) return;
        toggleBookmark(tourId);
      }}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M12 20.5s-7.5-4.6-9.6-9.3C1 7.9 3.1 4.5 6.6 4.5c2.1 0 3.6 1.2 5.4 3.2 1.8-2 3.3-3.2 5.4-3.2 3.5 0 5.6 3.4 4.2 6.7-2.1 4.7-9.6 9.3-9.6 9.3z"
          fill={on ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
