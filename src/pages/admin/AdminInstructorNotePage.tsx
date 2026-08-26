import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { InstructorAdminNoteThread } from "@/components/instructor/InstructorAdminNoteThread";
import { useAppData } from "@/contexts/AppDataContext";

/** 관리자가 특정 강사에게 서류 보완 요청, 반려 사유 등 비공개 안내를 남기는 화면. */
const AdminInstructorNotePage = () => {
  const { instructorId } = useParams();
  const { getInstructorById } = useAppData();
  const instructor = instructorId ? getInstructorById(instructorId) : undefined;

  if (!instructorId) {
    return (
      <div className="flex min-h-full items-center justify-center p-6 text-sm text-muted-foreground">
        강사 정보를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <header
        className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card px-4"
        style={{ paddingTop: "env(safe-area-inset-top)", height: "calc(3.5rem + env(safe-area-inset-top))" }}
      >
        <Link to="/admin/instructors" className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="line-clamp-1 text-base font-semibold text-foreground">
          강사 안내 · {instructor?.name ?? "강사"}
        </h1>
      </header>
      <InstructorAdminNoteThread instructorId={instructorId} viewerRole="admin" viewerName="관리자" />
    </div>
  );
};

export default AdminInstructorNotePage;
