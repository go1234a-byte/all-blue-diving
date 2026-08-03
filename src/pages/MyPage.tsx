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
  const { role, authLoading } = useRole();

  return (
    <div className="min-h-full bg-gradient-surface pb-20">
      <AppHeader title={TITLE_BY_ROLE[role]} />
      <main className="mx-auto w-full max-w-md px-4 py-6 md:max-w-lg">
        {/* 로그인 직후(특히 방금 가입한 경우) session -> profiles 조회가 끝나기 전까지는
            role이 아직 "public"으로 남아있어, authLoading을 안 보면 실제로는 로그인된
            다이버인데도 "게스트 다이버"로 잠깐 잘못 표시된다. RequireRole 가드와 동일하게
            인증 정보 확인 중에는 로딩 상태만 보여준다. */}
        {authLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
            인증 정보를 확인하는 중...
          </div>
        ) : (
          <>
            {role === "instructor" && <InstructorMyPageView />}
            {role === "admin" && <AdminMyPageView />}
            {role === "public" && <DiverMyPageView />}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default MyPage;
