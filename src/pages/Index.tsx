import { useState } from "react";
import { Megaphone, ShieldCheck, MessageCircle, CalendarCheck, Lock, Users } from "lucide-react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { SearchForm } from "@/components/search/SearchForm";
import { TourCard } from "@/components/search/TourCard";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";

interface Feature {
  icon: typeof ShieldCheck;
  title: string;
  desc: string;
}

// "ALL BLUE만의 특별함" — 시안 하단 6개 피처 스트립과 동일한 구성.
const FEATURES: Feature[] = [
  { icon: Users, title: "신뢰할 수 있는 강사", desc: "인증된 강사진이 함께하는 안전한 투어" },
  { icon: ShieldCheck, title: "안전 최우선", desc: "철저한 안전 관리 시스템으로 안심 투어" },
  { icon: MessageCircle, title: "실시간 소통", desc: "강사와 다이버가 실시간으로 소통해요" },
  { icon: CalendarCheck, title: "간편한 예약", desc: "몇 번의 터치로 간편하게 예약 완료" },
  { icon: Lock, title: "안전한 결제", desc: "SSL 보안 시스템으로 안전한 결제" },
  { icon: Users, title: "다이버 커뮤니티", desc: "후기와 정보를 나누는 다이버 공간" },
];

const Index = () => {
  const { role, authLoading } = useRole();
  const { tours: allTours, notices } = useAppData();
  const location = useLocation();
  // 강사가 하단 네비게이션의 "투어 홈"을 직접 눌러 이동한 경우에는 state로 표시되어 있어
  // 아래 자동 리다이렉트를 건너뛰고 이 화면을 그대로 보여준다.
  const instructorBrowsing = (location.state as { instructorBrowsing?: boolean } | null)?.instructorBrowsing === true;

  // 로그인 역할에 따라 첫 화면을 분기한다: 강사는 대시보드, 관리자는 관리자 홈,
  // 비회원/다이버만 이 투어 홈 화면을 그대로 본다.
  if (!authLoading && role === "instructor" && !instructorBrowsing) {
    return <Navigate to="/instructor" replace />;
  }
  if (!authLoading && role === "admin") {
    return <Navigate to="/admin/home" replace />;
  }

  // 홈 화면 검색 폼의 "출발 월" 선택 상태. 여기서 관리해서 월을 고르는 즉시(페이지 이동 없이)
  // 아래 "모집중인 투어" 목록을 바로 필터링한다. 복수 선택 가능.
  const [months, setMonths] = useState<number[]>([]);

  // 관리자가 정지/보류 처리한 투어는 다이버에게 노출하지 않는다.
  // 모집 마감되었거나(최소 인원 미달로 취소된 경우 포함) 관리자가 정지/보류 처리한 투어는
  // 홈 화면 "모집중인 투어" 목록에서 제외한다 — 더 이상 예약을 받을 수 없기 때문.
  const tours = allTours
    .filter((t) => !t.adminStatus && t.status === "open")
    .filter((t) => months.length === 0 || months.includes(new Date(t.startDate).getMonth()));
  const pinnedNotice = notices.find((n) => n.pinned);

  return (
    <div className="min-h-full bg-gradient-surface pb-20">
      <AppHeader showLanguage />

      {/* 히어로 — 시안 "홈" 화면의 다크 오션 그라데이션 배경 + 카피 구성을 재현 */}
      <div className="relative overflow-hidden bg-gradient-ocean px-4 pb-8 pt-8 text-center md:pb-10 md:pt-10">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background:radial-gradient(circle_at_30%_20%,white,transparent_45%)]" />
        <div className="relative mx-auto flex max-w-md flex-col items-center gap-2 md:max-w-lg">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-primary-foreground md:text-3xl">
            다이빙의 모든 순간,
            <br />
            ALL BLUE와 함께
          </h1>
          <p className="text-sm text-primary-foreground/70">
            특별한 바다, 특별한 경험을 찾고 예약할 수 있습니다.
          </p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-md space-y-6 px-4 pt-6 pb-6 md:max-w-lg">
        {pinnedNotice && (
          <Link
            to="/support"
            className="flex items-start gap-2 rounded-xl border border-primary/30 bg-secondary/40 p-3 text-xs text-foreground transition-colors hover:bg-secondary"
          >
            <Megaphone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="line-clamp-1 break-keep">{pinnedNotice.title}</span>
          </Link>
        )}

        <SearchForm months={months} onMonthsChange={setMonths} />

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">모집중인 투어</h2>
            <span className="text-xs text-muted-foreground">{tours.length}개 투어</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        </section>

        {/* ALL BLUE만의 특별함 — 시안 하단 피처 스트립 */}
        <section className="space-y-3 pt-2">
          <h2 className="text-base font-semibold text-foreground">ALL BLUE만의 특별함</h2>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <f.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{f.title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
};

export default Index;
