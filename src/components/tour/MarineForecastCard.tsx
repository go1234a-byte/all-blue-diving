import { useEffect, useMemo, useState } from "react";
import { Waves } from "lucide-react";
import { cn } from "@/lib/utils";
import { daysUntil } from "@/lib/tripImage";
import { isFreshwaterSite, resolveTourCoordinate } from "@/lib/siteCoordinates";
import {
  fetchMarineForecast,
  isMarineForecastEnabled,
  seaCondition,
  weatherEmoji,
  type MarineDay,
} from "@/lib/marineForecast";
import type { Tour } from "@/types";

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 바다 예보 카드 (트리플 "일정판 날씨"를 다이빙용으로).
 * - 출발 8일 이내: 투어 날짜에 해당하는 날의 파고·바람·수온
 * - 그보다 멀면: "지금 현지 바다" 3일치 + 출발 8일 전부터 실제 예보가 보인다는 안내
 * - 세노테 등 민물: 바다 예보 대신 안내 문구
 */
export function MarineForecastCard({ tour, className }: { tour: Pick<Tour, "country" | "site" | "startDate" | "endDate">; className?: string }) {
  const coord = useMemo(() => resolveTourCoordinate(tour.country, tour.site), [tour.country, tour.site]);
  const freshwater = isFreshwaterSite(tour.site);
  const enabled = isMarineForecastEnabled() && Boolean(coord) && !freshwater;
  const [days, setDays] = useState<MarineDay[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled || !coord) return;
    let alive = true;
    fetchMarineForecast(coord.lat, coord.lng)
      .then((d) => alive && setDays(d))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [enabled, coord]);

  if (freshwater) {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Waves className="h-4 w-4 text-primary" />
          현지 물 상태
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          민물(세노테·호수) 다이빙이라 파도·조류 예보 대상이 아니에요. 비가 많이 오면 시야가 흐려질 수 있어요.
        </p>
      </div>
    );
  }
  if (!enabled || failed) return null;

  const dStart = daysUntil(tour.startDate);
  const dEnd = daysUntil(tour.endDate);
  const inWindow = dStart <= 7 && dEnd >= 0;
  const shown = days
    ? inWindow
      ? days.filter((d) => d.date >= tour.startDate.slice(0, 10) && d.date <= tour.endDate.slice(0, 10))
      : days.slice(0, 3)
    : [];

  return (
    <div className={cn("space-y-3 rounded-xl border border-border bg-card p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Waves className="h-4 w-4 text-primary" />
          {inWindow ? "투어 기간 바다 예보" : "지금 현지 바다"}
        </p>
        <span className="text-[10px] text-muted-foreground">{tour.site}</span>
      </div>

      {!days ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <p className="text-xs text-muted-foreground">예보를 불러오지 못했어요.</p>
      ) : (
        <ul className="space-y-1.5">
          {shown.map((d) => {
            const c = seaCondition(d);
            const date = new Date(`${d.date}T00:00:00`);
            return (
              <li key={d.date} className="flex items-center gap-3 rounded-lg bg-secondary/40 px-3 py-2">
                <div className="w-12 shrink-0 text-xs">
                  <p className="font-semibold text-foreground">
                    {date.getMonth() + 1}/{date.getDate()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {WEEKDAY[date.getDay()]} {weatherEmoji(d.weatherCode)}
                  </p>
                </div>
                <div className="grid flex-1 grid-cols-3 gap-1 text-center text-[11px]">
                  <div>
                    <p className="text-muted-foreground">파도</p>
                    <p className="font-semibold text-foreground">{d.waveMaxM != null ? `${d.waveMaxM.toFixed(1)}m` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">바람</p>
                    <p className="font-semibold text-foreground">{d.windMaxMs != null ? `${Math.round(d.windMaxMs)}m/s` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">수온</p>
                    <p className="font-semibold text-foreground">{d.seaTempC != null ? `${Math.round(d.seaTempC)}°C` : "—"}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    "w-16 shrink-0 rounded-full px-2 py-0.5 text-center text-[10px] font-semibold",
                    c.tone === "good" && "bg-success/15 text-success",
                    c.tone === "ok" && "bg-warning/20 text-warning-foreground",
                    c.tone === "rough" && "bg-destructive/15 text-destructive",
                  )}
                  title={c.label}
                >
                  {c.label.split(" · ")[0]}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <p className="break-keep text-[10px] leading-relaxed text-muted-foreground">
        {inWindow
          ? "외해 기준 모델 예보라 실제 포인트 상황과 다를 수 있어요. 운항 여부는 강사님 공지를 따라주세요."
          : `출발 7일 전(${Math.max(dStart - 7, 1)}일 뒤)부터 투어 날짜 예보로 바뀌어요.`}{" "}
        예보:{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline">
          Open-Meteo
        </a>{" "}
        (CC BY 4.0)
      </p>
    </div>
  );
}
