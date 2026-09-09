import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { Tour } from "@/types";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * 홈/검색 투어카드 위에서 관리자가 "현재인원"(수동 추가분)을 바로 +/- 하는 컨트롤.
 * AdminToursPage 의 handleAdjustHeadcount 와 같은 규칙 — manual_participant_count 만 조정하고,
 * 정원 초과(+)나 실제 예약 미만(-)은 막는다. DB 도 RLS+트리거로 admin 만 쓰기 허용.
 * 관리자가 아니면 아무것도 렌더하지 않는다.
 */
export function AdminHeadcountControl({ tour, className }: { tour: Tour; className?: string }) {
  const { role } = useRole();
  const { updateTour, getConfirmedParticipantCount } = useAppData();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (role !== "admin") return null;

  const current = getConfirmedParticipantCount(tour.id); // 확정예약 + 수동분 합계
  const adjust = async (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    e.stopPropagation();
    const next = tour.manualParticipantCount + delta;
    if (next < 0) return;
    if (delta > 0 && current >= tour.maxParticipants) return;
    setBusy(true);
    try {
      await updateTour(tour.id, { manualParticipantCount: next });
      toast({ title: `"${tour.title}" 현재인원(수동분)을 ${next}명으로 변경했습니다.` });
    } catch (err) {
      toast({
        title: "현재인원 변경에 실패했습니다",
        description: err instanceof Error ? err.message : "관리자 권한을 확인해주세요.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const btn =
    "flex h-5 w-5 items-center justify-center rounded border border-border bg-background text-foreground disabled:opacity-40";

  return (
    <div className={cn("flex items-center gap-1.5", className)} onClick={(e) => e.stopPropagation()}>
      <span className="text-[11px] font-medium text-muted-foreground">현재인원</span>
      <button
        type="button"
        className={btn}
        disabled={busy || tour.manualParticipantCount <= 0}
        onClick={(e) => adjust(e, -1)}
        aria-label="현재인원 1명 줄이기"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="min-w-[3.25rem] text-center text-[11px] font-semibold tabular-nums text-foreground">
        {current}/{tour.maxParticipants}명
      </span>
      <button
        type="button"
        className={btn}
        disabled={busy || current >= tour.maxParticipants}
        onClick={(e) => adjust(e, 1)}
        aria-label="현재인원 1명 늘리기"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}
