import { AlertTriangle, Award, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InstructorProfile } from "@/types";

interface InstructorMiniScoreboardProps {
  instructor: InstructorProfile;
  className?: string;
}

/**
 * 강사 신뢰검증 3열 마이크로 스코어보드.
 * [경력/로그] [투어 완료율] [안전 패널티 이력]
 * 패널티 건수가 0을 초과하면 즉시 눈에 띄도록 연한 붉은 톤으로 강조한다.
 */
export function InstructorMiniScoreboard({ instructor, className }: InstructorMiniScoreboardProps) {
  const hasPenalty = instructor.penaltyCount > 0;

  return (
    <div className={cn("grid grid-cols-3 gap-1.5", className)}>
      <div className="flex flex-col items-center justify-center gap-0.5 rounded-lg bg-secondary px-1.5 py-2 text-center">
        <Award className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-medium leading-tight text-muted-foreground">경력/로그</span>
        <span className="text-[11px] font-bold leading-tight text-foreground">
          Log {instructor.totalLogs.toLocaleString()}+
        </span>
        <span className="text-[10px] leading-tight text-muted-foreground">
          {instructor.experienceYears}년 경력
        </span>
      </div>

      <div className="flex flex-col items-center justify-center gap-0.5 rounded-lg bg-secondary px-1.5 py-2 text-center">
        <TrendingUp className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-medium leading-tight text-muted-foreground">완료율</span>
        <span className="text-[11px] font-bold leading-tight text-foreground">
          투어 완료율 {instructor.completionRate}%
        </span>
      </div>

      <div
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 rounded-lg px-1.5 py-2 text-center",
          hasPenalty ? "bg-destructive/10" : "bg-secondary",
        )}
      >
        <AlertTriangle className={cn("h-3.5 w-3.5", hasPenalty ? "text-destructive" : "text-primary")} />
        <span
          className={cn(
            "text-[10px] font-medium leading-tight",
            hasPenalty ? "text-destructive" : "text-muted-foreground",
          )}
        >
          안전 패널티
        </span>
        <span
          className={cn(
            "text-[11px] font-bold leading-tight",
            hasPenalty ? "text-destructive" : "text-foreground",
          )}
        >
          누적 {instructor.penaltyCount}회
        </span>
      </div>
    </div>
  );
}
