import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ArbitrationChatRoom } from "@/components/arbitration/ArbitrationChatRoom";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";

const InstructorArbitrationRoom = () => {
  const { currentInstructorId } = useRole();
  const { getInstructorById } = useAppData();
  const instructor = getInstructorById(currentInstructorId);

  return (
    <div className="min-h-full bg-[#050b18]">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-[#0a1428] px-4">
        <Link to="/mypage" className="text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-semibold text-white">비밀 중재방</h1>
      </header>
      <ArbitrationChatRoom
        instructorId={currentInstructorId}
        instructorName={instructor?.name ?? "강사"}
        viewerRole="instructor"
        viewerName={instructor?.name ?? "강사"}
      />
    </div>
  );
};

export default InstructorArbitrationRoom;
