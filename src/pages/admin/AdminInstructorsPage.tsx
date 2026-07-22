import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/tour/VerifiedBadge";
import { InstructorApplicationQueue } from "@/components/mypage/InstructorApplicationQueue";
import { useAppData } from "@/contexts/AppDataContext";

const AdminInstructorsPage = () => {
  const { instructors, tours } = useAppData();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {instructors.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">등록된 강사가 없습니다.</p>
        )}
        {instructors.map((instructor) => {
          const tourCount = tours.filter((t) => t.instructorId === instructor.id).length;
          return (
            <div key={instructor.id} className="space-y-1.5 rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{instructor.name}</p>
                {instructor.verified ? (
                  <VerifiedBadge />
                ) : (
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    심사중
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{instructor.agency ?? "소속 없음"}</p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span>등록 투어 {tourCount}개</span>
                <span>평점 {instructor.rating.toFixed(1)}</span>
                <Badge variant={instructor.penaltyCount > 0 ? "destructive" : "outline"} className="text-[10px]">
                  패널티 {instructor.penaltyCount}회
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">강사 인증 신청 큐</h3>
        <InstructorApplicationQueue />
      </div>
    </div>
  );
};

export default AdminInstructorsPage;
