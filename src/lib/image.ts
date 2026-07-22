import type { SyntheticEvent } from "react";

/** 이미지 로드 실패 시 보여줄 플레이스홀더 (연회색 배경 + "이미지 없음" 문구). */
export const IMAGE_PLACEHOLDER =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%2394a3b8'%3E%EC%9D%B4%EB%AF%B8%EC%A7%80 %EC%97%86%EC%9D%8C%3C/text%3E%3C/svg%3E";

/**
 * <img onError> 핸들러. 삭제되었거나(blob: URL 등) 접근할 수 없는 이미지 URL이면
 * 깨진 이미지 아이콘 대신 플레이스홀더를 보여준다. (무한 루프 방지를 위해 이미 플레이스홀더인
 * 경우는 다시 교체하지 않는다.)
 */
export function handleImageFallback(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.src !== IMAGE_PLACEHOLDER) {
    img.src = IMAGE_PLACEHOLDER;
  }
}
