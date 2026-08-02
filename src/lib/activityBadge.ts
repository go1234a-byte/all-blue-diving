import type { ActivityType } from "@/types";

/**
 * 액티비티 타입 한글 라벨 — 투어카드/투어상세 등에서 공통으로 사용.
 */
export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  scuba: "스쿠버다이빙",
  freediving: "프리다이빙",
  liveaboard: "리브어보드",
};

/**
 * 액티비티 타입별 뱃지 색상 — 한눈에 구별되도록 타입마다 다른 색을 사용한다.
 * scuba: 아쿠아(accent) · freediving: 코랄 · liveaboard: 골드(warning)
 * 세 색 모두 기존 디자인 토큰(index.css)을 그대로 재사용한다.
 */
export const ACTIVITY_BADGE_CLASS: Record<ActivityType, string> = {
  scuba: "bg-accent text-accent-foreground",
  freediving: "bg-coral text-coral-foreground",
  liveaboard: "bg-warning text-warning-foreground",
};
