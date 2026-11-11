// 빌드 때 검색 크롤러용 준비를 한다(vite build가 항상 실행하므로 빌드 명령이 바뀌어도 빠지지 않는다).
//  1) 가이드 글 데이터(api/_lib/crawlData.js)를 diveBasics.ts에서 다시 만든다.
//  2) dist/index.html 을 dist/spa.html 로 복사한다 — 서버리스 함수와 "그 밖의 모든 주소"가 쓰는 깨끗한 앱 껍데기.
//     (정적 파일이 있는 "/"는 vercel.json rewrite로 가로챌 수 없어서, 홈 본문은 dist/index.html 자체에 넣는다.)
//  3) dist/index.html(= "/")의 #root에 소개 문구와 링크를 넣는다. React가 켜지면 통째로 교체된다.
//     앱(Capacitor)은 localhost에서 열리므로 이 본문을 숨긴다.
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { genCrawlData } from "./gen-crawl-data.mjs";

export const HOME_BODY = `<main data-seo-home style="max-width:720px;margin:0 auto;padding:24px 16px;font-family:Pretendard,-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#14263A;line-height:1.6"><script>if(location.hostname==="localhost")document.documentElement.classList.add("native")</script><style>html.native [data-seo-home]{display:none}</style><h1>ALL BLUE — 모든 바다가 만나는 곳</h1><p>자격과 경력을 검증한 강사의 스쿠버다이빙·프리다이빙·리브어보드 투어를 한 곳에서 비교하고 예약하는 다이빙 투어 플랫폼입니다.</p><p><a href="/search">모집 중인 다이빙 투어 검색</a> · <a href="/guide">다이빙 기초·안전 가이드</a></p></main>`;

export function crawlPlugin() {
  return {
    name: "allblue-crawl",
    apply: "build",
    async buildStart() {
      await genCrawlData();
    },
    closeBundle() {
      const dir = "dist";
      copyFileSync(`${dir}/index.html`, `${dir}/spa.html`);
      const html = readFileSync(`${dir}/index.html`, "utf-8");
      if (!html.includes('<div id="root"></div>')) throw new Error("dist/index.html에서 빈 #root를 찾지 못했습니다");
      writeFileSync(`${dir}/index.html`, html.replace('<div id="root"></div>', `<div id="root">${HOME_BODY}</div>`));
    },
  };
}
