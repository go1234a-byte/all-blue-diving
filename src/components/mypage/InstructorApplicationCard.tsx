import { Link } from "react-router-dom";
import { ChevronRight, Compass } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { instructorApplicationStatus } from "@/lib/instructorApplication";

/** 다이버 마이페이지의 강사 전환 진입점. 신청 상태에 따라 안내와 재신청 링크를 보여준다. */
export function InstructorApplicationCard() {
  const { instructors } = useAppData();
  const { user } = useRole();
  const application = instructors.find((i) => i.profileId === user?.id);
  const status = instructorApplicationStatus(application);

  if (status === "pending") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <Compass className="h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold text-foreground">강사 전환 심사 중</p>
          <p className="text-xs text-muted-foreground">승인되면 알림을 보내드려요. 그동안 다이버 기능은 그대로 이용할 수 있어요.</p>
        </div>
      </div>
    );
  }

  // 승인 직후 역할이 갱신되기 전의 짧은 순간에는 다시 신청하라고 안내하지 않는다.
  if (status === "approved") return null;

  const rejected = status === "rejected";
  return (
    <Link
      to="/instructor-application"
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/40"
    >
      <Compass className="h-5 w-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{rejected ? "강사 전환 신청이 반려되었어요" : "강사로 활동하고 싶으신가요?"}</p>
        <p className="text-xs text-muted-foreground">
          {rejected ? `사유: ${application?.rejectionReason ?? "-"} · 눌러서 다시 신청하기` : "서류를 제출하고 관리자 승인을 받으면 투어를 등록할 수 있어요."}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
