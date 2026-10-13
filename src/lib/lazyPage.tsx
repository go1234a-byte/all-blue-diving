import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";

// 화면별 코드 분할 — 예전엔 관리자 콘솔·정산·차트·지도·결제 코드까지 전부 한 파일(2.5MB)로
// 묶여 있어서 홈만 보는 방문자도 앱 전체를 내려받았다. 홈(첫 화면)과 레이아웃 껍데기만
// 처음에 받고, 나머지 화면은 그 화면에 들어갈 때 받는다.
// eslint-disable-next-line react-refresh/only-export-components -- 이 파일은 라우트 헬퍼 모음이라 HMR 경계가 아니다.
function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-muted-foreground">
      불러오는 중...
    </div>
  );
}

// 배포 직후엔 이전 버전 HTML을 연 채로 있던 사용자가 이미 지워진 옛 청크를 요청해
// 실패할 수 있다 — 그때는 한 번만 새로고침해서 새 버전을 받게 한다.
const RELOAD_KEY = "allblue-chunk-reload";
export function load<T extends ComponentType>(factory: () => Promise<{ default: T }>): LazyExoticComponent<T> {
  return lazy(() =>
    factory()
      .then((mod) => {
        try { sessionStorage.removeItem(RELOAD_KEY); } catch { /* 저장소 차단 환경 */ }
        return mod;
      })
      .catch((error) => {
        let reloaded = false;
        try { reloaded = sessionStorage.getItem(RELOAD_KEY) === "1"; } catch { /* 무시 */ }
        if (!reloaded) {
          try { sessionStorage.setItem(RELOAD_KEY, "1"); } catch { /* 무시 */ }
          window.location.reload();
          return new Promise<never>(() => {});
        }
        throw error;
      }),
  );
}

export function page(Component: LazyExoticComponent<ComponentType>) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Component />
    </Suspense>
  );
}
