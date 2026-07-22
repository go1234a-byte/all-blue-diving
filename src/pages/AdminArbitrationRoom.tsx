import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ArbitrationChatRoom } from "@/components/arbitration/ArbitrationChatRoom";
import { useAppData } from "@/contexts/AppDataContext";

const AdminArbitrationRoom = () => {
  const { instructorId } = useParams();
  const { getInstructorById } = useAppData();
  const instructor = instructorId ? getInstructorById(instructorId) : undefined;

  if (!instructorId) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#050b18] p-6 text-sm text-white/60">
        강사 정보를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#050b18]">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-[#0a1428] px-4">
        <Link to="/admin" className="text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="line-clamp-1 text-base font-semibold text-white">
          비밀 중재방 · {instructor?.name ?? "강사"}
        </h1>
      </header>
      <ArbitrationChatRoom
        instructorId={instructorId}
        instructorName={instructor?.name ?? "강사"}
        viewerRole="admin"
        viewerName="최고관리자"
      />
    </div>
  );
};

export default AdminArbitrationRoom;
