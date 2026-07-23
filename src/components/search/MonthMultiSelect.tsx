import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MONTH_LABELS } from "@/lib/constants";
import { currentMonthIndex } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface MonthMultiSelectProps {
  value: number[];
  onChange: (months: number[]) => void;
}

// 현재 실제 월부터 올해 12월까지만 표시 (연도를 넘어가는 다음 해 월은 노출하지 않음)
export function MonthMultiSelect({ value, onChange }: MonthMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const start = currentMonthIndex();
  const months = Array.from({ length: 12 - start }, (_, i) => start + i);

  const toggle = (month: number) => {
    onChange(value.includes(month) ? value.filter((m) => m !== month) : [...value, month]);
  };

  const label =
    value.length === 0
      ? "출발 월 선택"
      : value
          .slice()
          .sort((a, b) => months.indexOf(a) - months.indexOf(b))
          .map((m) => MONTH_LABELS[m])
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
              {MONTH_LABELS[month]}
            </button>
          ))}
        </div>
        {value.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {value.map((m) => (
              <Badge key={m} variant="secondary">
                {MONTH_LABELS[m]}
              </Badge>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
