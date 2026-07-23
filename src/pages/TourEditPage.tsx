import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { TourEditForm } from "@/components/instructor/TourEditForm";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";

/** 강사가 "내 투어 목록"에서 [수정]을 눌러 들어오는, 이미 등록한 투어의 세부 정보 수정 화면. */
const TourEditPage = () => {
  const { tourId } = useParams();
  const { getTourById, toursLoading } = useAppData();
  const { currentInstructorId } = useRole();

  const tour = tourId ? getTourById(tourId) : undefined;

  // 본인이 등록한 투어가 아니면 수정 화면에 들어올 수 없게 막는다.
  if (tour && tour.instructorId !== currentInstructorId) {
    return <Navigate to="/instructor" replace />;
  }

  return (
    <div className="min-h-full bg-gradient-surface pb-24">
      <AppHeader title="투어 수정" />
      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
        <Link to="/instructor" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          강사 콘솔로
        </Link>
        {toursLoading && !tour && (
          <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
        )}
        {!toursLoading && !tour && (
          <p className="py-10 text-center text-sm text-muted-foreground">투어 정보를 찾을 수 없습니다.</p>
        )}
        {tour && <TourEditForm tour={tour} />}
      </main>
      <BottomNav />
    </div>
  );
};

export default TourEditPage;
