import { Minus, Plus } from "lucide-react";

/** 상세 예약 영역의 인원 − / + . 잔여 정원을 넘지 못하고 최소 1명. 실제 참가자 정보 입력과 쿠폰은 결제 화면에서 한다. */
export function PartySizeStepper({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) {
  const hi = Math.max(1, max);
  return (
    <div className="flex items-center gap-2" role="group" aria-label="인원">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label="인원 줄이기"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-[2.5rem] text-center text-sm font-semibold text-foreground" aria-live="polite">{value}명</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(hi, value + 1))}
        disabled={value >= hi}
        aria-label="인원 늘리기"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
