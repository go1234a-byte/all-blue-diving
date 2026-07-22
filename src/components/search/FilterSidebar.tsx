import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { formatKRW } from "@/lib/pricing";

export interface FilterState {
  priceRange: [number, number];
}

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  return (
    <aside className="space-y-6 rounded-2xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">상세 필터</h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">가격 범위</Label>
          <span className="text-xs font-medium text-foreground">
            {formatKRW(filters.priceRange[0])} - {formatKRW(filters.priceRange[1])}
          </span>
        </div>
        <Slider
          min={0}
          max={3500000}
          step={50000}
          value={filters.priceRange}
          onValueChange={(v) => onChange({ ...filters, priceRange: v as [number, number] })}
        />
      </div>
    </aside>
  );
}

export const DEFAULT_FILTERS: FilterState = {
  priceRange: [0, 3500000],
};
