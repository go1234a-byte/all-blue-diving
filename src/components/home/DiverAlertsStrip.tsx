import { Link } from "react-router-dom";
import { BellRing, X } from "lucide-react";
import { useDiverWish } from "@/contexts/DiverWishContext";

/**
 * 홈 상단 "새 소식" 띠 — 관심 바다에 새 투어가 열렸거나, 기다리던 투어에 빈자리가 났을 때.
 * 안 읽은 알림 최대 2건만. 누르면 투어 상세로 가면서 읽음 처리, ✕는 읽음 처리만.
 */
export function DiverAlertsStrip() {
  const { available, alerts, markAlertRead } = useDiverWish();
  if (!available) return null;
  const unread = alerts.filter((a) => !a.read).slice(0, 2);
  if (unread.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1200px] space-y-2 px-[clamp(24px,5vw,64px)] pt-6">
      {unread.map((a) => (
        <div
          key={a.id}
          className={`flex items-center gap-3 rounded-2xl border p-3.5 shadow-[0_6px_24px_rgba(10,27,46,.06)] ${
            a.type === "seat_open" ? "border-[#E5484D]/30 bg-[#FFF5F5]" : "border-[#17A8BD]/30 bg-[#F4FAFB]"
          }`}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              a.type === "seat_open" ? "bg-[#E5484D] text-white" : "bg-[#17A8BD] text-white"
            }`}
          >
            <BellRing className="h-4 w-4" />
          </span>
          <Link
            to={a.tourId ? `/tour/${a.tourId}` : "/search"}
            onClick={() => void markAlertRead(a.id)}
            className="min-w-0 flex-1"
          >
            <p className="truncate text-sm font-bold text-[#14324D]">{a.title}</p>
            <p className="truncate text-xs text-[#14324D]/70">{a.body}</p>
          </Link>
          <button
            type="button"
            onClick={() => void markAlertRead(a.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#14324D]/50 hover:bg-white"
            aria-label="알림 닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </section>
  );
}
