import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MONTH_LABELS } from "@/lib/constants";
import { currentMonthKey, monthOfKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface MonthMultiSelectProps {
  /** 연도까지 포함해 인코딩된 월 값(monthKey). 단순 0~11 월 번호로는 올해 10월과
   *  내년 10월을 구분할 수 없어 monthKey(연도*12+월)를 사용한다. */
  value: number[];
  onChange: (months: number[]) => void;
}

const MONTHS_AHEAD = 12; // 이번 달부터 12개월(연도를 넘어가도 계속) 표시

// 이번 달부터 향후 12개월을 표시한다 — 예전엔 "올해 12월까지만" 보여줘서
// 연말에 가까워질수록 고를 수 있는 달이 줄어들고, 다음 해 투어는 아예
// 선택할 방법이 없었다.
export function MonthMultiSelect({ value, onChange }: MonthMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const start = currentMonthKey();
  const months = Array.from({ length: MONTHS_AHEAD }, (_, i) => start + i);

  const toggle = (month: number) => {
    onChange(value.includes(month) ? value.filter((m) => m !== month) : [...value, month]);
  };

  const label =
    value.length === 0
      ? "출발 월 선택"
      : value
          .slice()
          .sort((a, b) => a - b)
          .map((m) => MONTH_LABELS[monthOfKey(m)])
          .join(", ");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-10 w-full justify-between font-normal"
        >
          <span className="truncate text-left">{label}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="grid grid-cols-3 gap-2">
          {months.map((month) => (
            <button
              key={month}
              type="button"
              onClick={() => toggle(month)}
              className={cn(
                "rounded-md border px-2 py-2 text-sm transition-colors",
                value.includes(month)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-secondary",
              )}
            >
              {MONTH_LABELS[monthOfKey(month)]}
              {Math.floor(month / 12) > Math.floor(start / 12) && (
                <span className="ml-1 text-[10px] opacity-70">(내년)</span>
              )}
            </button>
          ))}
        </div>
        {value.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {value.map((m) => (
              <Badge key={m} variant="secondary">
                {MONTH_LABELS[monthOfKey(m)]}
                {Math.floor(m / 12) > Math.floor(start / 12) ? " (내년)" : ""}
              </Badge>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
