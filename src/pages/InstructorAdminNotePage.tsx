import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { InstructorAdminNoteThread } from "@/components/instructor/InstructorAdminNoteThread";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";

/** 강사가 관리자로부터 받은 서류 보완 요청, 반려 사유 등 비공개 안내를 확인하고 답하는 화면. */
const InstructorAdminNotePage = () => {
  const { currentInstructorId } = useRole();
  const { getInstructorById } = useAppData();
  const instructor = getInstructorById(currentInstructorId);

  return (
    <div className="min-h-full bg-background">
      <header
        className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card px-4"
        style={{ paddingTop: "env(safe-area-inset-top)", height: "calc(3.5rem + env(safe-area-inset-top))" }}
      >
        <Link to="/mypage" className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-semibold text-foreground">관리자 안내</h1>
      </header>
      <InstructorAdminNoteThread
        instructorId={currentInstructorId}
        viewerRole="instructor"
        viewerName={instructor?.name ?? "강사"}
      />
    </div>
  );
};

export default InstructorAdminNotePage;
