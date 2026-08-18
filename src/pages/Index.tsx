import { useState } from "react";
import { Megaphone, ShieldCheck, MessageCircle, CalendarCheck, Lock, Users, Star, Building2, ChevronRight } from "lucide-react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { LogoWatermark } from "@/components/brand/Logo";
import { SearchForm } from "@/components/search/SearchForm";
import { TourCard } from "@/components/search/TourCard";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { BUSINESS_INFO } from "@/lib/businessInfo";

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
  { icon: Star, title: "생생한 후기", desc: "다녀온 다이버들의 진짜 후기를 확인해요" },
];

const Index = () => {
  const { role, authLoading } = useRole();
  const { tours: allTours, notices } = useAppData();
  const location = useLocation();
  // 강사가 하단 네비게이션의 "투어 홈"을 직접 눌러 이동한 경우에는 state로 표시되어 있어
  // 아래 자동 리다이렉트를 건너뛰고 이 화면을 그대로 보여준다.
  const instructorBrowsing = (location.state as { instructorBrowsing?: boolean } | null)?.instructorBrowsing === true;

  // 홈 화면 검색 폼의 "출발 월" 선택 상태. 여기서 관리해서 월을 고르는 즉시(페이지 이동 없이)
  // 아래 "모집중인 투어" 목록을 바로 필터링한다. 복수 선택 가능.
  // (React Hooks 규칙상 아래 조건부 return들보다 반드시 먼저 호출되어야 한다.)
  const [months, setMonths] = useState<number[]>([]);

  // 로그인 역할에 따라 첫 화면을 분기한다: 강사는 대시보드, 관리자는 관리자 홈,
  // 비회원/다이버만 이 투어 홈 화면을 그대로 본다.
  if (!authLoading && role === "instructor" && !instructorBrowsing) {
    return <Navigate to="/instructor" replace />;
  }
  if (!authLoading && role === "admin") {
    return <Navigate to="/admin/home" replace />;
  }

  // 관리자가 정지/보류 처리한 투어는 다이버에게 노출하지 않는다.
  // 모집 마감되었거나(최소 인원 미달로 취소된 경우 포함) 관리자가 정지/보류 처리한 투어는
  // 홈 화면 "모집중인 투어" 목록에서 제외한다 — 더 이상 예약을 받을 수 없기 때문.
  const tours = allTours
    .filter((t) => !t.adminStatus && t.status === "open")
    .filter((t) => months.length === 0 || months.includes(new Date(t.startDate).getMonth()));
  const pinnedNotice = notices.find((n) => n.pinned);

  return (
    <div className="min-h-full bg-gradient-surface pb-20">
      <AppHeader />

      {/* 히어로 — bg-gradient-ocean은 라이트 테마에서는 흰 배경에 가깝고, 다크 모드에서는
          오션 그라데이션으로 바뀐다. 텍스트도 text-foreground라 두 테마 모두에서 대비가 맞다.
          배경은 브랜드 심벌(로고)을 은은하게 확대해 워터마크로 깔아서 텍스트 가독성과 기존
          그라데이션 톤을 해치지 않게 한다. 공지 배너와 검색 폼(여행지 검색/출발 월/투어
          검색하기)까지 전부 이 영역 안에 포함시켜서, 헤더 아래부터 투어 검색하기 버튼까지
          하나의 배경 영역으로 이어지게 한다. */}
      <div className="relative overflow-hidden bg-gradient-ocean px-4 pb-8 pt-8 text-center md:pb-10 md:pt-10">
        <LogoWatermark
          className="pointer-events-none absolute left-1/2 top-0 h-[340px] w-[340px] -translate-x-1/2 -translate-y-16 text-primary opacity-[0.12] md:h-[400px] md:w-[400px]"
        />
        <div className="pointer-events-none absolute inset-0 opacity-20 [background:radial-gradient(circle_at_30%_20%,white,transparent_45%)]" />
        <div className="relative mx-auto flex max-w-md flex-col items-center gap-2 md:max-w-lg">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-primary drop-shadow-[0_1px_6px_hsl(var(--background))] md:text-3xl">
            다이빙의 모든 순간,
            <br />
            ALL BLUE와 함께
          </h1>
          <p className="text-sm font-medium text-primary/80 drop-shadow-[0_1px_4px_hsl(var(--background))]">
            특별한 바다, 특별한 경험을 찾고 예약할 수 있습니다.
          </p>
          {pinnedNotice && (
            <Link
              to="/support"
              className="mt-3 flex w-full items-start gap-2 rounded-xl border border-primary/30 bg-secondary/40 p-3 text-left text-xs text-foreground backdrop-blur-sm transition-colors hover:bg-secondary"
            >
              <Megaphone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="line-clamp-1 break-keep">{pinnedNotice.title}</span>
            </Link>
          )}
          <div className="mt-2 w-full text-left">
            <SearchForm months={months} onMonthsChange={setMonths} />
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-md space-y-6 px-4 pt-6 pb-6 md:max-w-lg">
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

        {/* 기업/단체 문의 — 워크샵/사내 행사 등 단체 예약 문의를 별도 게시판(/business-inquiry,
            business_inquiries 테이블)으로 받는다. support_tickets(1:1 문의)와 마찬가지로 로그인한
            다이버/강사(관리자 포함)만 이용 가능 — 게스트가 누르면 라우트 가드가 /auth로 보낸다. */}
        <section className="space-y-3 pt-2">
          <h2 className="text-base font-semibold text-foreground">기업/단체 문의</h2>
          <Link
            to="/business-inquiry"
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/40"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-relaxed text-muted-foreground">
                워크샵, 사내 행사 등 단체 다이빙 투어가 필요하시면 문의를 남겨주세요.
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        </section>

        {/* 사업자 정보 — 전자상거래법상 표시 의무 항목. 약관/개인정보처리방침 페이지에도
            동일 정보(BUSINESS_INFO, src/lib/businessInfo.ts)가 있지만, 그건 링크를 타고
            들어가야 보이므로 홈 화면 하단에도 그대로 노출한다. */}
        <section className="space-y-1 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
          <p>{BUSINESS_INFO.companyName} | 대표: {BUSINESS_INFO.ceoName}</p>
          <p>사업자등록번호: {BUSINESS_INFO.businessNumber}</p>
          <p>통신판매업신고번호: {BUSINESS_INFO.mailOrderNumber}</p>
          <p>주소: {BUSINESS_INFO.address}</p>
          <p>고객센터: {BUSINESS_INFO.email} | {BUSINESS_INFO.phone}</p>
          <div className="flex gap-2 pt-1">
            <Link to="/terms" className="underline underline-offset-2">이용약관</Link>
            <Link to="/privacy" className="underline underline-offset-2">개인정보처리방침</Link>
            <Link to="/refund-policy" className="underline underline-offset-2">환불정책</Link>
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
};

export default Index;
