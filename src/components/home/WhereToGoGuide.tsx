import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Compass, ChevronDown, ArrowRight, Waves, Droplets } from "lucide-react";
import type { ActivityType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ACTIVITY_LABEL } from "@/lib/activityBadge";
import {
  MONTH_LABELS_KR,
  SEASON_STATUS_LABEL,
  spotsForMonth,
  type DiveSpot,
  type SeasonStatus,
} from "@/lib/diveSeasons";

/**
 * "어디로 갈지 고민되나요?" — 스카이스캐너의 "언제 예약할지 고민되나요?" 카드처럼
 * 눌러서 펼치면 현재 달(또는 고른 달) 기준으로 스쿠버·프리다이빙 추천 포인트와
 * 최적의 시기를 카드뉴스 형태로 보여준다. 데이터는 src/lib/diveSeasons.ts.
 */

type ActivityFilter = "all" | ActivityType;

const ACTIVITY_TABS: { value: ActivityFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "scuba", label: "스쿠버" },
  { value: "freediving", label: "프리다이빙" },
];

const STATUS_PILL: Record<SeasonStatus, string> = {
  peak: "bg-white text-primary",
  soon: "bg-white/25 text-white ring-1 ring-inset ring-white/40",
  shoulder: "bg-white/15 text-white/90",
  off: "bg-white/10 text-white/70",
};

/** 카드 배경 테마 — 대표 액티비티(스쿠버 우선) 기준 */
function cardTheme(spot: DiveSpot): string {
  if (spot.activities.includes("scuba")) return "bg-gradient-to-br from-primary via-primary to-[#08243f]";
  if (spot.activities.includes("freediving")) return "bg-gradient-to-br from-accent via-accent to-primary";
  return "bg-[image:var(--gradient-ocean-light)]";
}

function CardNewsItem({
  spot,
  index,
  total,
  month,
  activity,
}: {
  spot: DiveSpot & { status: SeasonStatus };
  index: number;
  total: number;
  month: number;
  activity: ActivityFilter;
}) {
  const params = new URLSearchParams({ q: spot.query, months: String(month) });
  if (activity !== "all") params.set("activities", activity);

  return (
    <Link
      to={`/search?${params.toString()}`}
      className={cn(
        "group relative flex w-[86vw] max-w-[340px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl p-5 text-white shadow-ocean sm:w-[340px]",
        cardTheme(spot),
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 opacity-10">
        <Waves className="h-40 w-40" />
      </div>

      <div className="relative space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] tracking-widest text-white/70">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", STATUS_PILL[spot.status])}>
            {SEASON_STATUS_LABEL[spot.status]}
          </span>
        </div>

        <div>
          <p className="text-[11px] font-medium text-white/70">
            {spot.region} · {spot.activities.map((a) => ACTIVITY_LABEL[a]).join(" · ")}
          </p>
          <h3 className="mt-0.5 text-lg font-bold leading-tight">{spot.name}</h3>
        </div>

        <p className="text-[15px] font-semibold leading-snug text-white">“{spot.headline}”</p>
        <p className="text-[13px] leading-relaxed text-white/80 line-clamp-4">{spot.blurb}</p>

        <div className="flex flex-wrap gap-1.5">
          {spot.highlights.map((h) => (
            <span key={h} className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] text-white/90">
              #{h}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mt-4 space-y-2 border-t border-white/20 pt-3">
        <p className="flex items-center gap-1.5 text-[12px] text-white/80">
          <Droplets className="h-3.5 w-3.5" />
          {spot.water}
        </p>
        <span className="flex items-center gap-1 text-[13px] font-semibold text-white">
          이 시즌 투어 보기
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export function WhereToGoGuide() {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [activity, setActivity] = useState<ActivityFilter>("all");
  const currentMonth = new Date().getMonth();

  const spots = useMemo(
    () => spotsForMonth(month, activity === "all" ? undefined : activity),
    [month, activity],
  );
  const peakCount = spots.filter((s) => s.status === "peak").length;

  // 월/액티비티를 바꾸면 카드뉴스를 처음으로 되감는다.
  const carouselRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    carouselRef.current?.scrollTo({ left: 0 });
  }, [month, activity]);

  return (
    <section className="space-y-3 pt-2">
      {/* 프롬프트 카드 — 투어카드보다 조금 크게, 눌러서 펼침 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5 text-left transition-colors hover:from-primary/15 hover:to-accent/15"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Compass className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-foreground">어디로 갈지 고민되나요?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            데이터로 보는 지금 가장 좋은 스쿠버·프리다이빙 시즌
          </p>
        </div>
        <ChevronDown
          className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="space-y-3">
          {/* 액티비티 탭 */}
          <div className="flex gap-2">
            {ACTIVITY_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setActivity(t.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  activity === t.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary/60",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 월 선택 — 기본값은 이번 달 */}
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MONTH_LABELS_KR.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => setMonth(i)}
                className={cn(
                  "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  month === i
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary/60",
                )}
              >
                {label}
                {i === currentMonth && (
                  <span className={cn("ml-1", month === i ? "text-accent-foreground/80" : "text-accent")}>
                    ·이번 달
                  </span>
                )}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{MONTH_LABELS_KR[month]}</span> 기준
            {activity !== "all" && <> · {ACTIVITY_LABEL[activity]}</>} 추천 포인트{" "}
            {peakCount > 0 ? (
              <>
                — 지금이 최적인 곳 <span className="font-semibold text-primary">{peakCount}곳</span>
              </>
            ) : (
              "— 이달은 성수기 포인트가 적어요. 다른 달도 확인해보세요."
            )}
          </p>

          {/* 카드뉴스 캐러셀 */}
          <div
            ref={carouselRef}
            className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {spots.map((spot, i) => (
              <CardNewsItem
                key={spot.id}
                spot={spot}
                index={i}
                total={spots.length}
                month={month}
                activity={activity}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
