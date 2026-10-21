import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Heart } from "lucide-react";
import { useDiverWish } from "@/contexts/DiverWishContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { pointCountry } from "@/lib/diveWish";
import { cn } from "@/lib/utils";
import type { DivePoint } from "@/content/divePointGuide";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

/**
 * 다이빙 포인트 상세 시트 안의 "이 바다 가고 싶어요".
 * 저장하면 같은 나라에 (고른 달에 출발하는) 투어가 새로 열릴 때 알림이 온다.
 * 동시에 강사에게는 "어느 바다·어느 달에 수요가 있는지" 집계로 보인다.
 */
export function DiveWishPanel({ point, defaultMonth }: { point: DivePoint; defaultMonth: number }) {
  const { available, getWish, saveWish, removeWish, demandByPoint } = useDiverWish();
  const { isLoggedIn } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const saved = getWish(point.id);
  const [months, setMonths] = useState<number[]>(saved?.months ?? [defaultMonth]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMonths(saved?.months ?? [defaultMonth]);
  }, [saved, defaultMonth, point.id]);

  if (!available) return null;

  const count = demandByPoint.get(point.id) ?? 0;
  const country = pointCountry(point);

  const persist = async (next: number[]): Promise<boolean> => {
    setBusy(true);
    try {
      await saveWish(point, next);
      return true;
    } catch {
      toast({ title: "저장하지 못했어요", description: "잠시 후 다시 시도해주세요.", variant: "destructive" });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const toggleMonth = (m: number) => {
    const next = months.includes(m) ? months.filter((x) => x !== m) : [...months, m];
    setMonths(next);
    if (saved) void persist(next);
  };

  return (
    <div className="my-4 rounded-2xl border border-[#17A8BD]/30 bg-[#F4FAFB] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-[#14324D]">
          {saved ? "관심 바다로 등록했어요" : "이 바다, 가고 싶으세요?"}
        </p>
        {count > 0 && (
          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#17A8BD]">
            {count.toLocaleString()}명이 관심
          </span>
        )}
      </div>
      <p className="mt-1 break-keep text-xs leading-relaxed text-[#14324D]/70">
        {saved
          ? `${country}에서 ${months.length ? months.map((m) => `${m}월`).join("·") : "언제든"} 출발하는 투어가 열리면 알려드릴게요.`
          : `원하는 달을 고르면 ${country} 투어가 열릴 때 알려드려요. 강사님들도 수요를 보고 투어를 엽니다.`}
      </p>

      <div className="mt-3 grid grid-cols-6 gap-1.5">
        {MONTHS.map((m) => (
          <button
            key={m}
            type="button"
            disabled={busy}
            onClick={() => toggleMonth(m)}
            aria-pressed={months.includes(m)}
            className={cn(
              "rounded-lg border py-1.5 text-xs font-semibold transition-colors",
              months.includes(m)
                ? "border-[#17A8BD] bg-[#17A8BD] text-white"
                : "border-[#14324D]/15 bg-white text-[#14324D]/70",
            )}
          >
            {m}월
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-[#14324D]/50">달을 모두 끄면 "언제든" 알림을 받아요.</p>

      {saved ? (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await removeWish(point.id);
            } finally {
              setBusy(false);
            }
          }}
          className="mt-3 w-full rounded-xl border border-[#14324D]/15 bg-white py-2.5 text-xs font-semibold text-[#14324D]/70"
        >
          관심 해제
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (!isLoggedIn) {
              toast({ title: "로그인하면 알림을 받을 수 있어요" });
              navigate("/auth");
              return;
            }
            void persist(months).then(
              (ok) =>
                ok &&
                toast({ title: "관심 바다로 등록했어요", description: "투어가 열리면 알림함과 마이페이지에서 알려드릴게요." }),
            );
          }}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#17A8BD] py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Heart className="h-4 w-4" />
          가고 싶어요 · 투어 열리면 알림
          <Bell className="h-3.5 w-3.5 opacity-80" />
        </button>
      )}
    </div>
  );
}
