// 검색 크롤러용 본문(/guide)을 만들 데이터를 src/content에서 뽑아 api/_lib/crawlData.js로 쓴다.
// 화면 데이터(diveBasics.ts)와 크롤러에 주는 글이 갈라지지 않게, 빌드 때마다 다시 만든다.
import { build } from "esbuild";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const out = join(tmpdir(), `diveBasics-${process.pid}.mjs`);
await build({ entryPoints: ["src/content/diveBasics.ts"], bundle: true, format: "esm", platform: "node", outfile: out, logLevel: "error" });
const { DIVE_BASICS, DIVE_BASICS_NOTICE } = await import(pathToFileURL(out).href);
const body = `// 자동 생성 — scripts/gen-crawl-data.mjs (npm run build 때마다 다시 만들어집니다). 직접 고치지 마세요.\nexport const DIVE_BASICS = ${JSON.stringify(
  DIVE_BASICS.map(({ id, title, summary, body, sources, checkedAt }) => ({ id, title, summary, body, sources, checkedAt })),
  null,
  2,
)};\nexport const DIVE_BASICS_NOTICE = ${JSON.stringify(DIVE_BASICS_NOTICE)};\n`;
writeFileSync("api/_lib/crawlData.js", body);
console.log(`crawlData.js: ${DIVE_BASICS.length}개 글`);
