import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { InstructorApplicationForm } from "@/components/auth/InstructorApplicationForm";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { instructorApplicationStatus } from "@/lib/instructorApplication";

/** 다이버의 강사 전환 신청 화면. 이미 심사 중이거나 승인된 계정은 마이페이지로 돌려보낸다. */
const InstructorApplication = () => {
  const navigate = useNavigate();
  const { instructors } = useAppData();
  const { user } = useRole();
  const application = instructors.find((i) => i.profileId === user?.id);
  const status = instructorApplicationStatus(application);

  if (status === "pending" || status === "approved") {
    return <Navigate to="/mypage" replace />;
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6 md:max-w-lg">
      <Link to="/mypage" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        마이페이지
      </Link>
      <h1 className="text-xl font-bold text-foreground">강사 전환 신청</h1>
      <p className="mt-1 text-sm text-muted-foreground">서류 심사와 관리자 승인을 마치면 투어를 등록할 수 있어요.</p>
      {application?.rejectionReason && (
        <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
          이전 신청 반려 사유: {application.rejectionReason}
        </p>
      )}
      <div className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-ocean">
        <InstructorApplicationForm onSuccess={() => navigate("/mypage", { replace: true })} />
      </div>
    </div>
  );
};

export default InstructorApplication;
