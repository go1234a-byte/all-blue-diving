// ALL BLUE — 서버리스 함수들이 공유하는 SEO 헬퍼.
// (Vercel은 api/ 안에서 "_"로 시작하는 경로를 라우트로 만들지 않는다.)
//
// 이 프로젝트는 SSR이 없는 순수 SPA(Vite)라, 크롤러가 받는 첫 HTML은 모든 화면이 같은
// index.html이다. 투어/강사 상세 요청만 서버리스 함수가 가로채서, 실제 빌드된 index.html의
// <head>만 그 페이지에 맞게 바꿔 돌려준다(본문·스크립트는 100% 동일 → 화면 동작 그대로).

import fs from "fs";
import path from "path";

export const SUPABASE_URL = "https://fffslvvligcpadkcyzvo.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZnNsdnZsaWdjcGFka2N5enZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0ODExNDQsImV4cCI6MjEwMDA1NzE0NH0.Z0jo-JkL35Bxw9B4W4xlTG-1EkNRXyToqm0OyLHKzQI";

export const SITE_URL = "https://allbluedive.com";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
const ORG_ID = `${SITE_URL}/#organization`;

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 설명문을 공백 정리 후 155자 근처에서 자른다. */
export function toDescription(text, max = 155) {
  if (!text) return "";
  const flat = String(text).replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Supabase REST 조회. 조회 자체가 실패하면(네트워크·권한·서버 오류) 예외를 던진다 —
 * 호출하는 쪽이 "DB에 정말 없음(빈 배열 → 404)"과 "확인 못 함(기본 화면 200)"을
 * 구분해야, 일시 장애 때 멀쩡한 페이지를 404로 내보내지 않는다.
 */
export async function supabaseRows(query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${query.split("?")[0]}`);
  return res.json();
}

export function readIndexHtml() {
  return fs.readFileSync(path.join(process.cwd(), "dist", "index.html"), "utf-8");
}

// JSON-LD를 <script>에 그대로 넣을 때 "</script>" 같은 문자열로 태그가 끊기지 않게 한다.
function safeJson(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * index.html의 head를 페이지 전용 값으로 바꾼다.
 * @param {string} html
 * @param {{title:string, description:string, url:string, image?:string, ogType?:string,
 *          jsonLd?:object, noindex?:boolean}} meta
 */
export function injectHead(html, meta) {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const url = escapeHtml(meta.url);
  const image = escapeHtml(meta.image || DEFAULT_OG_IMAGE);

  let out = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description"\s+content="[^"]*"\s*\/>/, `<meta name="description" content="${description}" />`)
    .replace(/<meta property="og:title"\s+content="[^"]*"\s*\/>/, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta property="og:description"\s+content="[^"]*"\s*\/>/, `<meta property="og:description" content="${description}" />`)
    .replace(/<meta property="og:image"\s+content="[^"]*"\s*\/>/, `<meta property="og:image" content="${image}" />`)
    .replace(/<meta property="og:url"\s+content="[^"]*"\s*\/>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta property="og:type"\s+content="[^"]*"\s*\/>/, `<meta property="og:type" content="${escapeHtml(meta.ogType || "website")}" />`)
    .replace(/<link rel="canonical"\s+href="[^"]*"\s*\/>/, `<link rel="canonical" href="${url}" />`);

  // 페이지 사진은 og-image.png(1200x1200)와 크기/비율이 달라서, 고정 width/height를
  // 그대로 두면 카카오/페이스북이 잘못된 비율로 미리보기를 자를 수 있다 — 지워서
  // 크롤러가 실제 이미지 크기를 스스로 읽게 한다.
  if (meta.image) {
    out = out
      .replace(/<meta property="og:image:width" content="\d+" \/>\s*/, "")
      .replace(/<meta property="og:image:height" content="\d+" \/>\s*/, "");
  }

  const extra = [];
  if (meta.noindex) extra.push('<meta name="robots" content="noindex, follow" />');
  if (meta.jsonLd) extra.push(`<script type="application/ld+json">${safeJson(meta.jsonLd)}</script>`);
  if (extra.length) out = out.replace("</head>", `  ${extra.join("\n  ")}\n</head>`);
  return out;
}

export function sendHtml(res, html, status = 200) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // 404는 짧게만 캐시한다 — 방금 만든 투어가 캐시된 404에 가려지지 않게.
  res.setHeader(
    "Cache-Control",
    status === 404 ? "public, max-age=0, s-maxage=60" : "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
  );
  res.status(status).send(html);
}

/** 삭제됐거나 없는 투어/강사 주소: 앱 화면은 그대로(“찾을 수 없음” 표시) 두고 상태코드만 404. */
export function notFoundHtml(html) {
  return injectHead(html, {
    title: "페이지를 찾을 수 없습니다 | ALL BLUE",
    description: "요청하신 페이지가 삭제되었거나 주소가 바뀌었습니다.",
    url: `${SITE_URL}/`,
    noindex: true,
  }).replace(/\s*<link rel="canonical"[^>]*>/, "");
}

export const ORGANIZATION_REF = { "@id": ORG_ID };
