import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDiverWish } from "@/contexts/DiverWishContext";
import { DIVE_POINTS } from "@/content/divePointGuide";

/**
 * 강사 대시보드 — "다이버들이 가고 싶어하는 바다". 개인 정보 없이 지역·월별 인원만.
 * 투어를 새로 열 때 어디·언제가 수요가 있는지 근거로 쓰라는 카드.
 */
export function DiveDemandCard({ onCreateTour, compact }: { onCreateTour?: () => void; compact?: boolean }) {
  const { available, demand } = useDiverWish();

  const rows = useMemo(() => {
    // 포인트(지역) 단위로 묶고, 가장 많이 몰린 달 2개를 함께 보여준다.
    const byPoint = new Map<string, { pointId: string; country: string; months: Map<number, number>; peak: number }>();
    for (const r of demand) {
      const cur = byPoint.get(r.pointId) ?? { pointId: r.pointId, country: r.country, months: new Map(), peak: 0 };
      cur.months.set(r.month, (cur.months.get(r.month) ?? 0) + r.count);
      cur.peak = Math.max(cur.peak, r.count);
      byPoint.set(r.pointId, cur);
    }
    return [...byPoint.values()]
      .sort((a, b) => b.peak - a.peak)
      .slice(0, compact ? 3 : 6)
      .map((p) => ({
        ...p,
        label: DIVE_POINTS[p.pointId]?.region ?? p.country,
        topMonths: [...p.months.entries()]
          .filter(([m]) => m > 0)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([m, n]) => `${m}월 ${n}명`),
      }));
  }, [demand, compact]);

  if (!available) return null;
  if (compact && rows.length === 0) return null;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">다이버들이 가고 싶어하는 바다</p>
        </div>
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            아직 집계된 관심이 없어요. 다이버가 포인트 가이드에서 "가고 싶어요"를 누르면 여기에 모입니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.pointId} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{r.label}</p>
                  {r.topMonths.length > 0 && (
                    <p className="text-[11px] text-muted-foreground">인기 달: {r.topMonths.join(" · ")}</p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-primary">
                  {r.peak}명+
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-muted-foreground">
          같은 나라에 투어를 열면 관심 등록한 다이버에게 자동으로 알림이 갑니다.
          {onCreateTour && (
            <>
              {" "}
              <button type="button" onClick={onCreateTour} className="font-medium text-primary">
                투어 만들기 →
              </button>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
