import { cn } from "@/lib/utils";
import type { FavoriteBadge } from "@/lib/favoriteBadge";

const TONE_CLASS: Record<FavoriteBadge["tone"], string> = {
  // 마감은 red (closing 신호에만 red)
  closed: "bg-destructive/10 text-destructive dark:text-[hsl(0_85%_74%)]",
  // 핵심 숫자(남은 자리)는 primary
  urgent: "bg-primary/10 text-primary dark:text-primary-glow",
  seat: "bg-primary/10 text-primary dark:text-primary-glow",
  // 가격 인하는 보조 정보라 중립색
  price: "bg-secondary text-foreground",
};

/**
 * 찜한 투어 카드 위 상태 배지. 색은 의미별로 고정한다 (red = 마감, primary = 핵심 숫자, 중립 = 보조).
 * 다크 모드에서는 본문 대비 4.5:1을 맞추려고 밝은 톤(primary-glow, 밝은 red)을 쓴다.
 */
export function FavoriteStatusBadge({ badge }: { badge: FavoriteBadge }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[13px] font-semibold", TONE_CLASS[badge.tone])}>
      {badge.label}
    </span>
  );
}
