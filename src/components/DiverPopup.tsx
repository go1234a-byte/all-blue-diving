import { useEffect, useState } from "react";

const DISMISS_UNTIL_KEY = "allblue-diver-popup-dismiss-until";

function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  const until = window.localStorage.getItem(DISMISS_UNTIL_KEY);
  return !!until && Date.now() < Number(until);
}

/** 홈 화면 진입 시 뜨는 브랜드 비주얼("길잃은 다이버들이여 여기로 오라.") 팝업. "24시간 동안 안 보기"를 누르면 그 시점부터 24시간 동안 다시 뜨지 않는다(로컬 저장, 계정 무관). "창 닫기"는 이번만 닫고 다음 방문 때는 다시 뜬다. */
export function DiverPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isMuted()) setOpen(true);
  }, []);

  if (!open) return null;

  const handleMute24h = () => {
    window.localStorage.setItem(DISMISS_UNTIL_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-full w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-black shadow-2xl">
        <img src="/splash-diver.jpg" alt="ALL BLUE — 길잃은 다이버들이여 여기로 오라" className="max-h-[70vh] w-full object-contain" />
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
