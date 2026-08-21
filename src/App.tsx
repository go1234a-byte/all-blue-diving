import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routers } from "./router";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { SplashScreen } from "@/components/SplashScreen";
import { DiverPopup } from "@/components/DiverPopup";

const queryClient = new QueryClient();

const SPLASH_SESSION_KEY = "allblue-splash-shown";

const App = () => {
  const router = createBrowserRouter(routers);

  // 안드로이드 패키징(Capacitor) 전용: 기본 동작은 하드웨어 뒤로가기를 누르면 앱 내
  // 이동 기록(canGoBack)과 무관하게 무조건 앱이 종료/백그라운드로 내려간다 — 리스너를
  // 직접 등록해야만 "갈 수 있으면 뒤로, 없으면 종료"가 된다. 이게 없으면 투어 상세 등
  // 어느 화면에서 뒤로가기를 눌러도 곧장 앱이 꺼지는 것처럼 보인다(실제 에뮬레이터에서
  // 확인된 문제).
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listenerPromise = CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        CapacitorApp.exitApp();
      }
    });
    return () => {
      void listenerPromise.then((listener) => listener.remove());
    };
  }, []);
  // 스플래시는 브라우저 세션(탭)당 앱을 처음 열 때 딱 한 번만 보여준다.
  // 라우트별 페이지(Index.tsx 등)가 아니라 여기 최상위에서 관리해야, 페이지 이동/로그인 후
  // 리다이렉트 등으로 특정 페이지에 다시 진입할 때 광고 화면처럼 반복 노출되지 않는다.
  const [splashDone, setSplashDone] = useState(
    () => typeof window !== "undefined" && window.sessionStorage.getItem(SPLASH_SESSION_KEY) === "true",
  );

  const handleSplashFinish = () => {
    window.sessionStorage.setItem(SPLASH_SESSION_KEY, "true");
    setSplashDone(true);
  };

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <RoleProvider>
            <AppDataProvider>
              <Toaster />
              <Sonner />
              {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
              {splashDone && <DiverPopup />}
              <RouterProvider router={router} />
            </AppDataProvider>
          </RoleProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
