import { Progress } from "@/components/ui/progress";

interface OnboardingProgressProps {
  step: number;
  totalSteps: number;
  label: string;
}

/** 강사 가입 온보딩 단계 진행 인디케이터 (1/6 ~ 6/6). */
export function OnboardingProgress({ step, totalSteps, label }: OnboardingProgressProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="text-muted-foreground">{step} / {totalSteps}</span>
      </div>
      <Progress value={(step / totalSteps) * 100} className="h-1.5" />
    </div>
  );
}
