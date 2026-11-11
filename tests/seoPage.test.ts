import { test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error — JS 모듈
import { guideHtml, homeHtml, injectBody, tourBodyHtml, tourListHtml } from "../api/_lib/pageHtml.js";

const tour = (over = {}) => ({ id: "a1", title: "세부 투어", country: "필리핀", site: "세부", start_date: "2027-01-04", end_date: "2027-01-07", base_price: 1000000, ...over });

test("본문 주입: 빈 #root 안에만 넣고 나머지 HTML은 그대로", () => {
  const out = injectBody('<body><div id="root"></div><script></script></body>', "<h1>x</h1>");
  assert.match(out, /<div id="root"><main[^>]*><h1>x<\/h1><\/main><\/div><script>/);
});

test("투어 목록: 샘플은 빼고, 표시 가격은 수수료 10% 포함, 제목은 이스케이프", () => {
  const html = tourListHtml([tour(), tour({ id: "s", title: "예시 (샘플) 투어" }), tour({ id: "x", title: '<script>alert(1)</script>' })]);
  assert.ok(!html.includes("샘플"));
  assert.ok(html.includes("1,100,000원~"));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
});

test("투어가 없으면 준비 중 문구", () => {
  assert.match(homeHtml([]), /준비하고 있습니다/);
});

test("가이드: 제목·출처 링크·확인일이 들어간다", () => {
  const html = guideHtml([{ id: "c", title: "자격", summary: "요약", body: ["본문"], sources: [{ label: "PADI", url: "https://padi.com/" }], checkedAt: "2026-11-08" }], "안내");
  assert.ok(html.includes("<h2>자격</h2>") && html.includes("https://padi.com/") && html.includes("2026-11-08"));
});

test("투어 상세 본문: 제목·장소·날짜·설명", () => {
  const html = tourBodyHtml(tour(), "설명입니다");
  assert.ok(html.includes("<h1>세부 투어</h1>") && html.includes("세부, 필리핀") && html.includes("설명입니다"));
});
