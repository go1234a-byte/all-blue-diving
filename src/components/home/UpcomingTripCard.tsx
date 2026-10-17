import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, ChevronRight, ImageDown, MessageCircle } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { formatDateRangeKR } from "@/lib/dates";
import { buildTripIcs, daysUntil, shareOrDownloadFile } from "@/lib/tripImage";
import { handleImageFallback, IMAGE_PLACEHOLDER } from "@/lib/image";
import { TripShareDialog } from "@/components/tour/TripShareDialog";

/**
 * 홈 상단 "다가오는 다이빙" D-day 카드 (트리플 D-day 위젯에서 착안).
 * 로그인한 다이버에게 확정된 예약 중 가장 가까운 투어 1건만 보여준다 — 출발 전이면 D-n,
 * 투어 기간 중이면 "진행 중 n일차". 예약이 없으면 아무것도 그리지 않는다.
 */
export function UpcomingTripCard() {
  const { isLoggedIn, profile, role } = useRole();
  const { bookings, getTourById } = useAppData();
  const { toast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);

  const next = useMemo(() => {
    // MasterRole: 다이버는 "public". 강사·관리자 계정엔 D-day 카드를 띄우지 않는다.
    if (!isLoggedIn || !profile?.id || role !== "public") return null;
    return (
      bookings
        .filter((b) => b.diverId === profile.id && b.status === "confirmed")
        .map((b) => ({ b, t: getTourById(b.tourId) }))
        .filter((x): x is { b: typeof x.b; t: NonNullable<typeof x.t> } => Boolean(x.t) && !x.t?.cancelledAt)
        .filter(({ t }) => daysUntil(t.endDate) >= 0)
        .sort((a, z) => +new Date(a.t.startDate) - +new Date(z.t.startDate))[0] ?? null
    );
  }, [isLoggedIn, profile?.id, role, bookings, getTourById]);

  if (!next) return null;
  const { t } = next;
  const dStart = daysUntil(t.startDate);
  const inTrip = dStart <= 0;
  const dayNo = 1 - dStart;
  const label = inTrip ? `진행 중 · ${dayNo}일차` : dStart === 0 ? "D-DAY" : `D-${dStart}`;
  const safeName = t.title.replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 40);

  return (
    <section className="mx-auto w-full max-w-[1200px] px-[clamp(24px,5vw,64px)] pt-6">
      <div className="overflow-hidden rounded-2xl border border-[#17A8BD]/25 bg-white shadow-[0_8px_30px_rgba(10,27,46,.08)]">
        <Link to={`/tour/${t.id}`} className="flex items-center gap-4 p-4">
          <img
            src={t.mainImageUrl || IMAGE_PLACEHOLDER}
            alt=""
            onError={handleImageFallback}
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-wide text-[#17A8BD]">다가오는 다이빙</p>
            <p className="truncate text-[15px] font-bold text-[#14324D]">{t.title}</p>
            <p className="truncate text-xs text-[#14324D]/70">
              {t.country} · {t.site} · {formatDateRangeKR(t.startDate, t.endDate)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-2xl font-extrabold leading-none ${inTrip || dStart <= 7 ? "text-[#E5484D]" : "text-[#14324D]"}`}>
              {label}
            </p>
            <ChevronRight className="ml-auto mt-1 h-4 w-4 text-[#14324D]/40" />
          </div>
        </Link>
        <div className="grid grid-cols-3 border-t border-[#14324D]/10 text-xs font-semibold text-[#14324D]">
          <Link to={`/chat/${t.id}`} className="flex items-center justify-center gap-1.5 py-3 hover:bg-[#F4FAFB]">
            <MessageCircle className="h-4 w-4 text-[#17A8BD]" />
            그룹 채팅
          </Link>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex items-center justify-center gap-1.5 border-x border-[#14324D]/10 py-3 hover:bg-[#F4FAFB]"
          >
            <ImageDown className="h-4 w-4 text-[#17A8BD]" />
            일정 공유
          </button>
          <button
            type="button"
            onClick={async () => {
              const r = await shareOrDownloadFile(buildTripIcs(t), `ALLBLUE_${safeName}.ics`, t.title);
              if (r === "downloaded") toast({ title: "캘린더 파일을 받았어요", description: "파일을 열면 내 캘린더에 추가됩니다." });
            }}
            className="flex items-center justify-center gap-1.5 py-3 hover:bg-[#F4FAFB]"
          >
            <CalendarPlus className="h-4 w-4 text-[#17A8BD]" />
            캘린더
          </button>
        </div>
      </div>
      <TripShareDialog tour={t} open={shareOpen} onOpenChange={setShareOpen} showCalendar />
    </section>
  );
}
