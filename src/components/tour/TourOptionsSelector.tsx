import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { formatKRW } from "@/lib/pricing";
import type { TourOption } from "@/types";

interface TourOptionsSelectorProps {
  options: TourOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
}

/**
 * 투어 상세/체크아웃 공용 유료 옵션 선택 카드.
 * 강사가 [투어 생성]에서 활성화(isActive)한 옵션만 노출한다.
 */
export function TourOptionsSelector({ options, selectedIds, onChange }: TourOptionsSelectorProps) {
  const activeOptions = options.filter((o) => o.isActive);

  if (activeOptions.length === 0) return null;

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);
  };

  return (
    <Card className="border-2 border-primary/40">
      <CardContent className="space-y-3 p-4">
        <h3 className="break-keep text-sm font-semibold text-foreground">➕ 추가 유료 옵션 선택</h3>
        <div className="space-y-2">
          {activeOptions.map((option) => (
            <label
              key={option.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
            >
              <span className="flex min-w-0 items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={selectedIds.includes(option.id)}
                  onCheckedChange={() => toggle(option.id)}
                />
                <span className="break-keep">{option.name}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-primary">+{formatKRW(option.price)}</span>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
