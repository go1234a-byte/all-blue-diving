import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstructorDashboard } from "@/components/instructor/InstructorDashboard";
import { TourCreateForm } from "@/components/instructor/TourCreateForm";
import { SettlementLedger } from "@/components/instructor/SettlementLedger";
import { InstructorReviewsPanel } from "@/components/instructor/InstructorReviewsPanel";
import { useRole } from "@/contexts/RoleContext";
import { useAppData } from "@/contexts/AppDataContext";

// 강사 콘솔도 다른 화면과 동일하게 하단 네비게이션을 유지하고, 그 위에 상단 탭으로 세부 메뉴를 이동한다.
const InstructorConsole = () => {
  const [tab, setTab] = useState("dashboard");
  const { currentInstructorId } = useRole();
  const { getInstructorById } = useAppData();
  const isVerifiedInstructor = getInstructorById(currentInstructorId)?.verified === true;

  return (
    <div className="min-h-full bg-gradient-surface pb-24">
      <AppHeader title="강사 콘솔" />
      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
        {!isVerifiedInstructor && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
            관리자 승인(인증배지) 대기 중이에요. 승인 전에는 투어를 실제로 등록할 수 없어요 —
            내용은 미리 준비해두시고, 승인되면 바로 등록해주세요.
          </div>
        )}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid h-auto w-full grid-cols-4 gap-1 p-1">
            <TabsTrigger value="dashboard" className="px-1 py-1.5 text-xs">대시보드</TabsTrigger>
            <TabsTrigger value="create" className="px-1 py-1.5 text-xs">투어생성</TabsTrigger>
            <TabsTrigger value="reviews" className="px-1 py-1.5 text-xs">리뷰</TabsTrigger>
            <TabsTrigger value="settlement" className="px-1 py-1.5 text-xs">정산</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="pt-4">
            <InstructorDashboard
              instructorId={currentInstructorId}
              onViewBookings={() => setTab("settlement")}
            />
          </TabsContent>
          <TabsContent value="create" className="pt-4">
            <TourCreateForm instructorId={currentInstructorId} onCreated={() => setTab("dashboard")} />
          </TabsContent>
          <TabsContent value="reviews" className="pt-4">
            <InstructorReviewsPanel instructorId={currentInstructorId} />
          </TabsContent>
          <TabsContent value="settlement" className="pt-4">
            <SettlementLedger instructorId={currentInstructorId} />
          </TabsContent>
        </Tabs>
      </main>
      <BottomNav />
    </div>
  );
};

export default InstructorConsole;
