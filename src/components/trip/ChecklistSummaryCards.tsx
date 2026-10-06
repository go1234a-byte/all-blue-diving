import type { ChecklistProgress } from "@/lib/packingChecklist";
import { progressPercent } from "@/lib/packingChecklist";

/**
 * 준비물 요약 3칸: 출발까지 D-N / 준비 진행률 / 필수 미완료.
 * primary는 핵심 숫자(D-N, 진행률)에만, amber는 준비가 덜 된 필수 항목에만 쓴다.
 */
export function ChecklistSummaryCards({ dDay, progress }: { dDay: number; progress: ChecklistProgress }) {
  const percent = progressPercent(progress);
  const dDayLabel = dDay > 0 ? `D-${dDay}` : dDay === 0 ? "오늘 출발" : "출발 완료";

  return (
    <section className="grid grid-cols-3 gap-3" aria-label="준비 요약">
      <SummaryCard label="출발까지">
        <span className="text-[20px] font-bold text-primary dark:text-primary-glow">{dDayLabel}</span>
      </SummaryCard>
      <SummaryCard label="준비 진행">
        <span className="text-[20px] font-bold text-primary dark:text-primary-glow">{percent}%</span>
        <span className="text-[13px] text-muted-foreground">
          {progress.done}/{progress.total}
        </span>
      </SummaryCard>
      <SummaryCard label="필수 미완료">
        {progress.requiredLeft > 0 ? (
          <span className="text-[20px] font-bold text-[hsl(32_95%_32%)] dark:text-[hsl(38_95%_68%)]">{progress.requiredLeft}개</span>
        ) : (
          <span className="text-[15px] font-semibold text-foreground">모두 완료</span>
        )}
      </SummaryCard>
    </section>
  );
}

function SummaryCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-border bg-card p-3">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
