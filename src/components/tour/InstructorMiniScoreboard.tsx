import { Award, CalendarCheck, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InstructorProfile } from "@/types";

interface InstructorMiniScoreboardProps {
  instructor: InstructorProfile;
  /** 이 강사가 등록한 투어 총 개수. 안전 패널티는 여기서 노출하지 않고
   *  강사 프로필 더보기(InstructorPublicProfile) 화면에서만 사유와 함께 보여준다. */
  tourCount: number;
  className?: string;
}

/**
 * 강사 신뢰검증 3열 마이크로 스코어보드.
 * [경력/로그] [투어 완료율] [진행 투어]
 * 안전 패널티는 이 카드가 아니라 "강사 프로필 더보기"에 들어갔을 때만 사유와 함께 노출한다.
 */
export function InstructorMiniScoreboard({ instructor, tourCount, className }: InstructorMiniScoreboardProps) {
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

      <div className="flex flex-col items-center justify-center gap-0.5 rounded-lg bg-secondary px-1.5 py-2 text-center">
        <CalendarCheck className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-medium leading-tight text-muted-foreground">진행 투어</span>
        <span className="text-[11px] font-bold leading-tight text-foreground">{tourCount}회</span>
      </div>
    </div>
  );
}
