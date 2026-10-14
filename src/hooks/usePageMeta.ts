import { useEffect } from "react";

// ALL BLUE — 페이지별 <title> / description / canonical / robots를 SPA 안에서 갱신하는 훅.
//
// 이 프로젝트는 SSR이 없는 Vite SPA라 index.html의 메타태그가 모든 화면에 똑같이 박혀
// 있었다. 구글은 JS를 실행한 뒤의 DOM으로 색인하므로, 화면이 바뀔 때 여기서 head를
// 고쳐 주면 투어/강사 페이지마다 고유한 제목·설명·대표 URL로 색인된다.
// 화면을 떠날 때(unmount)는 index.html 기본값으로 되돌려, 이 훅을 쓰지 않는 화면에
// 이전 페이지의 제목이 남지 않게 한다.

export const SITE_URL = "https://allbluedive.com";
const DEFAULT_TITLE = "ALL BLUE - 모든 바다가 만나는 곳";
const DEFAULT_DESCRIPTION = "전 세계 스쿠버다이빙 & 프리다이빙 투어를 한 곳에서 비교하고 예약하세요.";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

export interface PageMeta {
  /** 브랜드 접미사(" | ALL BLUE")는 자동으로 붙는다. 비우면 기본 제목. */
  title?: string;
  description?: string;
  /** 사이트 기준 경로 (예: "/tour/abc"). 쿼리스트링은 넣지 않는다. */
  path?: string;
  image?: string;
  /** 404·개인화 화면처럼 검색 결과에 나오면 안 되는 화면. */
  noindex?: boolean;
}

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function apply(meta: PageMeta) {
  const title = meta.title ? `${meta.title} | ALL BLUE` : DEFAULT_TITLE;
  const description = meta.description?.trim() || DEFAULT_DESCRIPTION;
  const url = `${SITE_URL}${meta.path ?? "/"}`;
  const image = meta.image || DEFAULT_IMAGE;

  document.title = title;
  setMeta("name", "description", description);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:url", url);
  setMeta("property", "og:image", image);
  setCanonical(url);

  const robots = document.head.querySelector('meta[name="robots"]');
  if (meta.noindex) setMeta("name", "robots", "noindex, follow");
  else robots?.remove();
}

/** 160자 근처에서 자연스럽게 자른 설명문. */
export function toDescription(text: string | undefined | null, max = 155): string | undefined {
  if (!text) return undefined;
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1).trimEnd()}…`;
}

export function usePageMeta(meta: PageMeta | null) {
  const { title, description, path, image, noindex } = meta ?? {};
  const ready = meta !== null;

  useEffect(() => {
    if (!ready) return;
    apply({ title, description, path, image, noindex });
    return () => apply({});
  }, [ready, title, description, path, image, noindex]);
}
