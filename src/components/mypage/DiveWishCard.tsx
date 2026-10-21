import { Link } from "react-router-dom";
import { BellRing, Heart, X } from "lucide-react";
import { useDiverWish } from "@/contexts/DiverWishContext";
import { useAppData } from "@/contexts/AppDataContext";

/** 마이페이지 — 내 관심 바다와 빈자리 알림을 한곳에서 보고 끄는 카드. */
export function DiveWishCard() {
  const { available, wishes, removeWish, seatAlertTourIds, toggleSeatAlert } = useDiverWish();
  const { getTourById } = useAppData();
  if (!available) return null;
  const seatTours = [...seatAlertTourIds].map((id) => getTourById(id)).filter(Boolean);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">관심 바다 · 알림</h3>
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        {wishes.length === 0 && seatTours.length === 0 ? (
          <div className="space-y-2 text-center">
            <p className="text-xs text-muted-foreground">
              다이빙 포인트 가이드에서 "가고 싶어요"를 누르면, 그 나라에 투어가 열릴 때 알려드려요.
            </p>
            <Link to="/?explore=guide" className="inline-block text-xs font-semibold text-primary">
              다이빙 포인트 둘러보기 →
            </Link>
          </div>
        ) : (
          <>
            {wishes.map((w) => (
              <div key={w.id} className="flex items-center gap-2">
                <Heart className="h-4 w-4 shrink-0 fill-primary text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{w.region}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {w.months.length ? w.months.map((m) => `${m}월`).join(" · ") : "언제든"} 출발 투어 알림
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void removeWish(w.pointId)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
                  aria-label={`${w.region} 관심 해제`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {seatTours.map((t) => (
              <div key={t!.id} className="flex items-center gap-2">
                <BellRing className="h-4 w-4 shrink-0 text-destructive" />
                <Link to={`/tour/${t!.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{t!.title}</p>
                  <p className="text-[11px] text-muted-foreground">빈자리 알림 대기 중</p>
                </Link>
                <button
                  type="button"
                  onClick={() => void toggleSeatAlert(t!.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
                  aria-label="빈자리 알림 끄기"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
