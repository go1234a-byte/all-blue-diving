import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { DiverMyPageView } from "@/components/mypage/DiverMyPageView";
import { InstructorMyPageView } from "@/components/mypage/InstructorMyPageView";
import { AdminMyPageView } from "@/components/mypage/AdminMyPageView";
import { useRole } from "@/contexts/RoleContext";

const TITLE_BY_ROLE: Record<string, string> = {
  public: "마이페이지",
  instructor: "강사 마이페이지",
  admin: "관리자 마이페이지",
};

const MyPage = () => {
  const { role } = useRole();

  return (
    <div className="min-h-full bg-gradient-surface pb-20">
      <AppHeader title={TITLE_BY_ROLE[role]} />
      <main className="mx-auto w-full max-w-md px-4 py-6 md:max-w-lg">
        {role === "instructor" && <InstructorMyPageView />}
        {role === "admin" && <AdminMyPageView />}
        {role === "public" && <DiverMyPageView />}
      </main>
      <BottomNav />
    </div>
  );
};

export default MyPage;
