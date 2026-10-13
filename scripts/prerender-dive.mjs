// ALL BLUE — 다이빙 포인트 가이드 정적 HTML 생성 (vite build 다음에 실행).
//
// 이 프로젝트는 SSR이 없는 SPA라, 크롤러가 받는 첫 HTML엔 본문이 없다. 구글은 JS를 실행해
// 결국 읽지만 네이버 등은 그렇지 못하고, 공유 미리보기(카카오 등)는 아예 JS를 안 돌린다.
// 다이빙 포인트 가이드는 내용이 코드에 고정된 정적 데이터라, 빌드할 때 페이지마다
// dist/dive/<id>/index.html을 만들어 <head>(제목·설명·canonical·JSON-LD)와 본문을 미리 채운다.
// 스크립트 태그는 원래 index.html 그대로라 브라우저에선 평소처럼 앱이 뜬다.
//
// 출력:
//   dist/dive/index.html            — 목록
//   dist/dive/<id>/index.html       — 포인트 56곳
//   dist/dive/manifest.json         — api/sitemap.js가 읽는 { indexable, paths }

import { build } from "esbuild";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { injectHead, SITE_URL } from "../api/_lib/seo.js";

const root = process.cwd();
const dist = path.join(root, "dist");
const tmpDir = path.join(root, "node_modules", ".cache", "prerender-dive");
const entry = path.join(tmpDir, "entry.ts");
const out = path.join(tmpDir, "bundle.mjs");

fs.mkdirSync(tmpDir, { recursive: true });
fs.writeFileSync(
  entry,
  [
    `export * from ${JSON.stringify(path.join(root, "src/lib/divePointSeo.ts"))};`,
    `export * from ${JSON.stringify(path.join(root, "src/lib/diveStaticHtml.ts"))};`,
    `export { DIVE_CSS } from ${JSON.stringify(path.join(root, "src/content/divePageStyles.ts"))};`,
  ].join("\n"),
);
await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", outfile: out, logLevel: "error" });
const m = await import(pathToFileURL(out).href + `?t=${Date.now()}`);

const template = fs.readFileSync(path.join(dist, "index.html"), "utf-8");
if (!template.includes('<div id="root"></div>')) {
  throw new Error('[prerender-dive] dist/index.html에서 <div id="root"></div>를 찾지 못했습니다.');
}

function render({ meta, jsonLd, body }) {
  let html = injectHead(template, {
    title: `${meta.title} | ALL BLUE`,
    description: meta.description,
    url: `${SITE_URL}${meta.path}`,
    image: meta.image,
    jsonLd,
    noindex: !m.DIVE_GUIDE_INDEXABLE,
  });
  html = html.replace("</head>", `  <style>${m.DIVE_CSS}</style>\n</head>`);
  return html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

function write(rel, html) {
  const file = path.join(dist, rel, "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

write("dive", render({ meta: m.DIVE_INDEX_META, jsonLd: m.diveIndexJsonLd(), body: m.diveIndexStaticHtml() }));

const points = m.allDivePoints();
for (const p of points) {
  write(
    path.join("dive", p.id),
    render({ meta: m.divePointMeta(p), jsonLd: m.divePointJsonLd(p), body: m.divePointStaticHtml(p) }),
  );
}

// 없는 포인트(/dive/없는-id)는 vercel.json rewrite 대상 파일이 없어 Vercel이 404.html을
// 404 상태코드로 내준다 — 그게 앱 화면이면 "페이지를 찾을 수 없습니다"가 정상적으로 뜬다.
fs.writeFileSync(path.join(dist, "404.html"), template);

fs.writeFileSync(
  path.join(dist, "dive", "manifest.json"),
  JSON.stringify({ indexable: m.DIVE_GUIDE_INDEXABLE, paths: ["/dive", ...points.map((p) => m.divePointPath(p.id))] }),
);

console.log(
  `[prerender-dive] ${points.length + 1}개 페이지 생성 (색인 ${m.DIVE_GUIDE_INDEXABLE ? "허용" : "보류 — DIVE_GUIDE_INDEXABLE=false"})`,
);
