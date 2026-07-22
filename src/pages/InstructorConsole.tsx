import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstructorDashboard } from "@/components/instructor/InstructorDashboard";
import { TourCreateForm } from "@/components/instructor/TourCreateForm";
import { SettlementLedger } from "@/components/instructor/SettlementLedger";
import { InstructorChatPanel } from "@/components/instructor/InstructorChatPanel";
import { InstructorReviewsPanel } from "@/components/instructor/InstructorReviewsPanel";
import { InstructorMyPageView } from "@/components/mypage/InstructorMyPageView";
import { useRole } from "@/contexts/RoleContext";

// 강사 콘솔도 다른 화면과 동일하게 하단 네비게이션을 유지하고, 그 위에 상단 탭으로 세부 메뉴를 이동한다.
const InstructorConsole = () => {
  const [tab, setTab] = useState("dashboard");
  const { currentInstructorId } = useRole();

  return (
    <div className="min-h-full bg-gradient-surface pb-24">
      <AppHeader title="강사 콘솔" />
      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
            <TabsTrigger value="dashboard">대시보드</TabsTrigger>
            <TabsTrigger value="create">투어 생성</TabsTrigger>
            <TabsTrigger value="chat">채팅</TabsTrigger>
            <TabsTrigger value="reviews">리뷰</TabsTrigger>
            <TabsTrigger value="settlement">정산</TabsTrigger>
            <TabsTrigger value="mypage">마이페이지</TabsTrigger>
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
          <TabsContent value="chat" className="pt-4">
            <InstructorChatPanel instructorId={currentInstructorId} />
          </TabsContent>
          <TabsContent value="reviews" className="pt-4">
            <InstructorReviewsPanel instructorId={currentInstructorId} />
          </TabsContent>
          <TabsContent value="settlement" className="pt-4">
            <SettlementLedger instructorId={currentInstructorId} />
          </TabsContent>
          <TabsContent value="mypage" className="pt-4">
            <InstructorMyPageView />
          </TabsContent>
        </Tabs>
      </main>
      <BottomNav />
    </div>
  );
};

export default InstructorConsole;
