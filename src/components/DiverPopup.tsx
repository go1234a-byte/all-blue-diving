import { useEffect, useState } from "react";

const DISMISS_UNTIL_KEY = "allblue-diver-popup-dismiss-until";
// "창 닫기"만 누른 경우에도 같은 탭(세션) 안에서는 다시 뜨지 않게 한다 — 예전에는 홈에 올 때마다
// 첫 화면을 가려서, 반복 방문 시 사용자가 서비스를 보기도 전에 팝업부터 닫아야 했다.
const SEEN_SESSION_KEY = "allblue-diver-popup-seen-session";

function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  const until = window.localStorage.getItem(DISMISS_UNTIL_KEY);
  return !!until && Date.now() < Number(until);
}

/** 홈 화면 진입 시 뜨는 브랜드 팝업. 예전엔 종교적 이미지를 연상시키는 일러스트("길잃은 다이버들이여
 * 여기로 오라.")였는데, 첫 방문자에게 호불호가 크고 서비스 내용(다이빙 투어 비교·예약)이 전혀
 * 드러나지 않아 실사 수중 사진 + 서비스 소개 + 바로가기 CTA로 교체했다. 원본 이미지는
 * public/splash-diver.webp 에 그대로 남아 있다. "24시간 동안 안 보기"를 누르면 그 시점부터 24시간 동안 다시 뜨지 않는다(로컬 저장, 계정 무관). "창 닫기"는 이번만 닫고 다음 방문 때는 다시 뜬다. */
/** RouterProvider 바깥(App 최상단)에 마운트되므로 useNavigate 대신 onCta 로 라우터 이동을 넘겨받는다. */
export function DiverPopup({ onCta }: { onCta?: () => void }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isMuted()) return;
    if (window.sessionStorage.getItem(SEEN_SESSION_KEY)) return;
    window.sessionStorage.setItem(SEEN_SESSION_KEY, "1");
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const handleMute24h = () => {
    window.localStorage.setItem(DISMISS_UNTIL_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    setOpen(false);
  };

  return (
    // 바깥 영역을 누르면 닫히고, 이미지는 화면 절반 이하로 줄여 홈이 가려지는 면적을 줄인다.
    <div
      className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={() => setOpen(false)}
    >
      <div
        className="flex max-h-full w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-[46vh] max-h-[420px] min-h-[300px] w-full overflow-hidden">
          <img src="/landing/descend.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A1B2E]/10 via-[#0A1B2E]/35 to-[#0A1B2E]/90" />
          <div className="absolute inset-x-0 bottom-0 space-y-2 p-6 text-white">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#7FD8E4]">ALL BLUE</p>
            <h2 className="break-keep text-2xl font-bold leading-snug">모든 바다가 만나는 곳</h2>
            <p className="break-keep text-sm leading-relaxed text-white/80">
              자격·경력을 검증한 강사의 스쿠버·프리다이빙 투어를 한곳에서 비교하고 예약하세요.
            </p>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onCta?.();
              }}
              className="mt-2 w-full rounded-xl bg-[#17A8BD] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1496A9]"
            >
              모집중인 투어 보기
            </button>
          </div>
        </div>
        <div className="flex border-t border-white/10">
          <button
            type="button"
            onClick={handleMute24h}
            className="flex-1 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/10"
          >
            24시간 동안 안 보기
          </button>
          <div className="w-px bg-white/10" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            창 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
