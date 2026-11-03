import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { MonthMultiSelect } from "@/components/search/MonthMultiSelect";
import { DEFAULT_FILTERS, countActiveFilters, type FilterState } from "@/components/search/FilterSidebar";
import { ACTIVITY_LABEL } from "@/lib/activityBadge";
import { formatKRW } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { ActivityType } from "@/types";

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  priceMax: number;
  countryOptions: string[];
}

const ACTIVITIES: ActivityType[] = ["scuba", "freediving", "liveaboard"];
const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

function ChipButton({ on, children, ...rest }: { on: boolean; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-medium",
        on ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Dropdown({ label, on, children }: { label: string; on: boolean; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <ChipButton on={on}>
          {label}
          <ChevronDown className="h-3.5 w-3.5" />
        </ChipButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-3 p-3">
        {children}
      </PopoverContent>
    </Popover>
  );
}

function Option({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background")}
    >
      {children}
    </button>
  );
}

/** 모바일 검색 상단: 가로로 넘기는 필터 칩 한 줄(누르면 그 조건만 고르는 작은 창) + 출발확정/환불 가능 토글. 데스크톱은 사이드바를 그대로 쓴다. */
export function SearchChipBar({ filters, onChange, priceMax, countryOptions }: Props) {
  const hi = Math.min(filters.priceRange[1], priceMax);
  const priceOn = filters.priceRange[0] > 0 || Number.isFinite(filters.priceRange[1]);
  const anyActive = countActiveFilters(filters) > 0;
  return (
    <div className="-mx-4 space-y-2 border-b border-border bg-card px-4 pb-3 pt-3 md:hidden">
      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ChipButton on={!anyActive} onClick={() => onChange(DEFAULT_FILTERS)}>전체</ChipButton>
        {countryOptions.length > 1 && (
          <Dropdown label="지역" on={filters.countries.length > 0}>
            <div className="flex flex-wrap gap-1.5">
              {countryOptions.map((c) => (
                <Option key={c} on={filters.countries.includes(c)} onClick={() => onChange({ ...filters, countries: toggle(filters.countries, c) })}>{c}</Option>
              ))}
            </div>
          </Dropdown>
        )}
        <Dropdown label="출발월" on={filters.months.length > 0}>
          <MonthMultiSelect value={filters.months} onChange={(months) => onChange({ ...filters, months })} />
        </Dropdown>
        <Dropdown label="종류" on={filters.activities.length > 0}>
          <div className="flex flex-wrap gap-1.5">
            {ACTIVITIES.map((a) => (
              <Option key={a} on={filters.activities.includes(a)} onClick={() => onChange({ ...filters, activities: toggle(filters.activities, a) })}>{ACTIVITY_LABEL[a]}</Option>
            ))}
          </div>
        </Dropdown>
        <Dropdown label="가격" on={priceOn}>
          <p className="text-xs font-medium">
            {formatKRW(filters.priceRange[0])} - {Number.isFinite(filters.priceRange[1]) ? formatKRW(hi) : "상한 없음"}
          </p>
          <Slider min={0} max={priceMax} step={100000} value={[filters.priceRange[0], hi]} onValueChange={(v) => onChange({ ...filters, priceRange: [v[0], v[1] >= priceMax ? Infinity : v[1]] })} />
        </Dropdown>
        <Dropdown label="조건" on={filters.beginnerOnly || filters.flightIncluded}>
          <div className="flex flex-wrap gap-1.5">
            <Option on={filters.beginnerOnly} onClick={() => onChange({ ...filters, beginnerOnly: !filters.beginnerOnly })}>입문자 참가 가능</Option>
            <Option on={filters.flightIncluded} onClick={() => onChange({ ...filters, flightIncluded: !filters.flightIncluded })}>✈️ 항공 포함</Option>
          </div>
        </Dropdown>
      </div>
      <div className="flex gap-4 text-[13px]">
        {([["confirmedOnly", "출발확정만"], ["refundableOnly", "환불 가능만"]] as const).map(([key, label]) => (
          <label key={key} className="flex cursor-pointer items-center gap-1.5">
            <button
              type="button"
              role="switch"
              aria-checked={filters[key]}
              aria-label={label}
              onClick={() => onChange({ ...filters, [key]: !filters[key] })}
              className={cn("relative h-5 w-9 rounded-full transition-colors", filters[key] ? "bg-primary" : "bg-muted-foreground/30")}
            >
              <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", filters[key] ? "left-[18px]" : "left-0.5")} />
            </button>
            <span className={filters[key] ? "font-semibold text-foreground" : "text-muted-foreground"}>{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
