import { useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { formatKRW } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { MonthMultiSelect } from "@/components/search/MonthMultiSelect";
import { ACTIVITY_LABEL } from "@/lib/activityBadge";
import type { ActivityType } from "@/types";

export interface FilterState {
  /** [하한, 상한]. 상한이 Infinity면 "상한 없음". */
  priceRange: [number, number];
  months: number[];
  activities: ActivityType[];
  countries: string[];
  /** OW/프리다이빙 입문 자격 + 로그 조건 없음 */
  beginnerOnly: boolean;
  /** 포함 사항에 항공권이 들어간 투어만 */
  flightIncluded: boolean;
}

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  /** 슬라이더 오른쪽 끝 값 — 현재 모집중인 투어의 최고가 기준으로 Search가 계산해 넘긴다. */
  priceMax: number;
  /** 지금 모집중인 투어에 실제로 있는 나라만 칩으로 보여준다. */
  countryOptions: string[];
}

const ACTIVITY_OPTIONS: ActivityType[] = ["scuba", "freediving", "liveaboard"];

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        on
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export function countActiveFilters(f: FilterState): number {
  return (
    (f.months.length ? 1 : 0) +
    (f.activities.length ? 1 : 0) +
    (f.countries.length ? 1 : 0) +
    (f.beginnerOnly ? 1 : 0) +
    (f.flightIncluded ? 1 : 0) +
    (f.priceRange[0] > 0 || Number.isFinite(f.priceRange[1]) ? 1 : 0)
  );
}

export function FilterSidebar({ filters, onChange, priceMax, countryOptions }: FilterSidebarProps) {
  // 모바일에선 필터가 결과 위를 다 가려서 기본은 접어 둔다(데스크톱은 항상 펼침).
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = countActiveFilters(filters);
  const hi = Math.min(filters.priceRange[1], priceMax);

  return (
    <aside className="rounded-2xl border border-border bg-card p-4 md:self-start">
      <button
        type="button"
        className="flex w-full items-center justify-between md:pointer-events-none"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          상세 필터
          {active > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
              {active}
            </span>
          )}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform md:hidden", mobileOpen && "rotate-180")} />
      </button>

      <div className={cn("mt-5 space-y-6", !mobileOpen && "hidden md:block")}>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">다이빙 종류</Label>
          <div className="flex flex-wrap gap-1.5">
            {ACTIVITY_OPTIONS.map((a) => (
              <Chip
                key={a}
                on={filters.activities.includes(a)}
                onClick={() => onChange({ ...filters, activities: toggle(filters.activities, a) })}
              >
                {ACTIVITY_LABEL[a]}
              </Chip>
            ))}
          </div>
        </div>

        {countryOptions.length > 1 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">나라</Label>
            <div className="flex flex-wrap gap-1.5">
              {countryOptions.map((c) => (
                <Chip
                  key={c}
                  on={filters.countries.includes(c)}
                  onClick={() => onChange({ ...filters, countries: toggle(filters.countries, c) })}
                >
                  {c}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">출발 월 (복수 선택 가능)</Label>
          <MonthMultiSelect value={filters.months} onChange={(months) => onChange({ ...filters, months })} />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">조건</Label>
          <div className="flex flex-wrap gap-1.5">
            <Chip on={filters.beginnerOnly} onClick={() => onChange({ ...filters, beginnerOnly: !filters.beginnerOnly })}>
              입문자 참가 가능
            </Chip>
            <Chip on={filters.flightIncluded} onClick={() => onChange({ ...filters, flightIncluded: !filters.flightIncluded })}>
              ✈️ 항공 포함
            </Chip>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">가격 범위 (1인)</Label>
            <span className="text-xs font-medium text-foreground">
              {formatKRW(filters.priceRange[0])} - {Number.isFinite(filters.priceRange[1]) ? formatKRW(hi) : "상한 없음"}
            </span>
          </div>
          <Slider
            min={0}
            max={priceMax}
            step={100000}
            value={[filters.priceRange[0], hi]}
            onValueChange={(v) =>
              onChange({ ...filters, priceRange: [v[0], v[1] >= priceMax ? Infinity : v[1]] })
            }
          />
        </div>

        {active > 0 && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="w-full rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-secondary"
          >
            필터 초기화
          </button>
        )}
      </div>
    </aside>
  );
}

/**
 * 예전 기본값은 [0, 3,500,000]이라 그보다 비싼 투어(예: 라자암팟 리브어보드 462만원)가
 * 필터를 건드리지도 않았는데 검색 결과에서 빠졌다 — 홈엔 4개, 검색엔 3개로 어긋난 원인.
 * 이제 기본 상한은 "없음(Infinity)"이다.
 */
export const DEFAULT_FILTERS: FilterState = {
  priceRange: [0, Infinity],
  months: [],
  activities: [],
  countries: [],
  beginnerOnly: false,
  flightIncluded: false,
};
