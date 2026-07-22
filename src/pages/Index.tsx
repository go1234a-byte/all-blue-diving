import { useState } from "react";
import { Megaphone } from "lucide-react";
import { Link } from "react-router-dom";
import { SplashScreen } from "@/components/SplashScreen";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { SearchForm } from "@/components/search/SearchForm";
import { TourCard } from "@/components/search/TourCard";
import { Logo } from "@/components/brand/Logo";
import { useAppData } from "@/contexts/AppDataContext";

const SPLASH_SESSION_KEY = "allblue-splash-shown";

const Index = () => {
  const [splashDone, setSplashDone] = useState(
    () => typeof window !== "undefined" && window.sessionStorage.getItem(SPLASH_SESSION_KEY) === "true",
  );
  const { tours: allTours, notices } = useAppData();
  // 관리자가 정지/보류 처리한 투어는 다이버에게 노출하지 않는다.
  const tours = allTours.filter((t) => !t.adminStatus);
  const pinnedNotice = notices.find((n) => n.pinned);

  const handleSplashFinish = () => {
    window.sessionStorage.setItem(SPLASH_SESSION_KEY, "true");
    setSplashDone(true);
  };

  return (
    <>
      {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
      <div className="min-h-full bg-gradient-surface pb-20">
        <AppHeader showLanguage />
        <main className="mx-auto w-full max-w-md space-y-6 px-4 py-6 md:max-w-lg">
          <div className="flex flex-col items-center gap-3 pb-1 pt-2 text-center">
            <Logo size="lg" />
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-foreground">모든 바다가 만나는 곳</h1>
              <p className="text-sm text-muted-foreground">
                전 세계 스쿠버다이빙 & 프리다이빙 투어를 한 곳에서 비교하고 예약하세요.
              </p>
            </div>
          </div>

          {pinnedNotice && (
            <Link
              to="/support"
              className="flex items-start gap-2 rounded-xl border border-primary/30 bg-secondary/40 p-3 text-xs text-foreground transition-colors hover:bg-secondary"
            >
              <Megaphone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="line-clamp-1 break-keep">{pinnedNotice.title}</span>
            </Link>
          )}

          <SearchForm />

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
        </main>
        <BottomNav />
      </div>
    </>
  );
};

export default Index;
