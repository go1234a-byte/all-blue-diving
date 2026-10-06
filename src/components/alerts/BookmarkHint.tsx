import { Bookmark } from "lucide-react";

/** 투어 상세에서 찜 버튼 아래 한 줄 안내. 첫 찜 이후에는 호출하는 쪽에서 렌더하지 않는다. */
export function BookmarkHint() {
  return (
    <p className="flex items-center gap-2 rounded-xl bg-secondary/60 px-4 py-3 text-[13px] text-muted-foreground">
      <Bookmark className="h-4 w-4 shrink-0 text-primary dark:text-primary-glow" />
      찜하면 가격 인하·자리 소식을 알려드려요
    </p>
  );
}
