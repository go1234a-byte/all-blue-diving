import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routers } from "./router";
import { RoleProvider } from "@/contexts/RoleContext";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { SplashScreen } from "@/components/SplashScreen";

const queryClient = new QueryClient();

const SPLASH_SESSION_KEY = "allblue-splash-shown";

const App = () => {
  const router = createBrowserRouter(routers);
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RoleProvider>
          <AppDataProvider>
            <Toaster />
            <Sonner />
            {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
            <RouterProvider router={router} />
          </AppDataProvider>
        </RoleProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
