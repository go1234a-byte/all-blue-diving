import { Bell } from "lucide-react";

/** 검색 결과가 있을 때 필터 아래에 두는 얇은 안내 띠. 0건 화면의 버튼과 같은 기능을 연다. */
export function SearchAlertBanner({ onAlert }: { onAlert: () => void }) {
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card px-4 py-2">
      <Bell className="h-5 w-5 shrink-0 text-primary dark:text-primary-glow" />
      <p className="min-w-0 flex-1 text-[15px] text-foreground">이 조건으로 새 투어가 열리면 알려드릴까요?</p>
      <button
        type="button"
        onClick={onAlert}
        className="h-11 shrink-0 rounded-full bg-primary px-4 text-[15px] font-semibold text-primary-foreground transition-colors hover:opacity-90"
      >
        알림 받기
      </button>
    </div>
  );
}
