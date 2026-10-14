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

/** 홈 화면 진입 시 뜨는 브랜드 비주얼("길잃은 다이버들이여 여기로 오라.") 팝업. "24시간 동안 안 보기"를 누르면 그 시점부터 24시간 동안 다시 뜨지 않는다(로컬 저장, 계정 무관). "창 닫기"는 이번만 닫고 다음 방문 때는 다시 뜬다. */
export function DiverPopup() {
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
        <img src="/splash-diver.webp" alt="ALL BLUE — 길잃은 다이버들이여 여기로 오라" className="max-h-[50vh] w-full object-contain" />
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
