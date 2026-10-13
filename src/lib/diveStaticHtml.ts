// ALL BLUE — 다이빙 포인트 가이드의 "JS 실행 전" 정적 마크업.
//
// scripts/prerender-dive.mjs가 빌드 후 이 함수들로 dist/dive/**/index.html의 <div id="root">
// 안을 채운다. 네이버처럼 JS를 거의 실행하지 않는 크롤러도 본문·링크를 그대로 읽게 하기
// 위해서다. 브라우저에선 React가 뜨는 순간 이 내용을 같은 화면(DivePointPage /
// DiveGuideIndex)으로 바꿔 그린다 — 두 쪽 마크업(클래스·문구)을 맞춰 두면 바뀌는 티가 안 난다.
// (실시간 데이터인 "이 지역 투어" 목록만 정적 HTML에선 검색 링크로 대신한다.)

import type { DivePoint } from "../content/divePointGuide";
import {
  DIVE_INDEX_META,
  MONTH_LABELS,
  allDivePoints,
  divePointPath,
  formatMonthRanges,
  recommendedMonths,
  searchQueryFor,
  splitPointTag,
  splitRegion,
  stripExample,
} from "./divePointSeo";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const DISCLAIMER =
  "시즌·수온·시야·해양생물 정보는 다이빙 업계 자료를 참고한 일반적인 안내이며, 해마다 조건이 달라질 수 있습니다.";

function bar(backHref: string, backLabel: string) {
  return `<header class="dv-bar"><div class="dv-wrap"><a href="${backHref}" class="dv-back">${esc(backLabel)}</a><a href="/" class="dv-brand">ALL BLUE<span>올블루</span></a></div></header>`;
}

function card(p: DivePoint, headingTag: "h2" | "p") {
  const cls = "dv-card-h";
  return `<a href="${divePointPath(p.id)}" class="dv-card"><img src="${esc(p.image)}" alt="${esc(p.region)} 다이빙" loading="lazy" /><div class="dv-card-b"><span class="dv-card-r">${esc(p.region)}</span><${headingTag} class="${cls}">${esc(p.hook)}</${headingTag}><span class="dv-card-s">추천 시기 · ${esc(formatMonthRanges(recommendedMonths(p.id)))}</span>${p.special ? '<span class="dv-card-sp">특수 다이빙</span>' : ""}</div></a>`;
}

export function divePointStaticHtml(point: DivePoint): string {
  const { country } = splitRegion(point.region);
  const season = formatMonthRanges(recommendedMonths(point.id));
  const mine = new Set(recommendedMonths(point.id));
  const sameSeason = allDivePoints()
    .filter((p) => p.id !== point.id && recommendedMonths(p.id).some((m) => mine.has(m)))
    .slice(0, 6);

  const facts = [
    season ? ["추천 시기", season] : null,
    ["수온 · 시야", stripExample(point.water)],
    ["추천 레벨", stripExample(point.level)],
    point.access ? ["가는 길", stripExample(point.access)] : null,
  ]
    .filter((x): x is string[] => !!x)
    .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
    .join("");

  const points = point.points
    .map((pt, i) => {
      const { tag, text } = splitPointTag(pt.desc);
      return `<li><span class="dv-n">${i + 1}</span><b>${esc(pt.name)}${tag ? `<span class="dv-tag">${esc(tag)}</span>` : ""}</b><span class="dv-d">${esc(text)}</span></li>`;
    })
    .join("");

  return `<div class="dv">${bar("/dive", "← 다이빙 포인트 가이드")}
<section class="dv-hero"><img src="${esc(point.image)}" alt="${esc(point.region)} 다이빙" fetchpriority="high" /><div class="dv-wrap"><p class="dv-eyebrow light">${esc(country ?? "다이빙 포인트 가이드")}</p><h1>${esc(point.region)} 다이빙</h1><p class="dv-hook">${esc(point.hook)}</p>${season ? `<span class="dv-season">추천 시기 · ${esc(season)}</span>` : ""}</div></section>
<main class="dv-wrap"><dl class="dv-facts">${facts}</dl>
<section class="dv-sec"><h2>${esc(point.region)}, 이런 바다입니다</h2><p class="dv-lead">${esc(point.oneLiner)}</p><p class="dv-p">${esc(point.detail)}</p>${point.special ? '<p class="dv-note">⚠️ 민물·동굴·화산호수·아이스 등 특수 다이빙입니다. 일반 오픈워터 자격만으로는 참여가 제한될 수 있고, 케이브·드라이슈트·아이스 다이빙 등 별도 교육과 장비가 필요할 수 있습니다.</p>' : ""}</section>
<section class="dv-sec"><h2>대표 다이빙 포인트</h2><ol class="dv-points">${points}</ol></section>
<section class="dv-sec"><h2>만날 수 있는 해양생물</h2><ul class="dv-chips">${point.life.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></section>
${point.gallery.length ? `<section class="dv-sec"><div class="dv-gallery">${point.gallery.map((g) => `<img src="${esc(g)}" alt="" loading="lazy" />`).join("")}</div></section>` : ""}
<section class="dv-sec"><h2>${esc(country ? `${country} 다이빙 투어` : "모집중인 투어")}</h2><a class="dv-cta" href="/search?q=${encodeURIComponent(searchQueryFor(point))}">투어 찾아보기 →</a></section>
${sameSeason.length ? `<section class="dv-sec"><h2>같은 시기에 좋은 다이빙 포인트</h2><div class="dv-grid">${sameSeason.map((p) => card(p, "p")).join("")}</div></section>` : ""}
<p class="dv-disclaimer">${esc(DISCLAIMER)} 실제 일정은 각 투어 상세의 강사 안내를 확인해 주세요.</p></main></div>`;
}

export function diveIndexStaticHtml(): string {
  const points = allDivePoints();
  return `<div class="dv">${bar("/", "← 홈")}
<section class="dv-index-head"><div class="dv-wrap"><p class="dv-eyebrow light">DIVE POINT GUIDE</p><h1>언제, 어디로 다이빙을 떠날까요</h1><p>국내외 다이빙 포인트 ${points.length}곳의 시즌·수온·해양생물·추천 레벨을 정리했습니다. 떠나고 싶은 달을 고르면 그때 좋은 바다만 모아 보여드립니다.</p></div></section>
<nav class="dv-months" aria-label="월 선택"><div class="dv-wrap"><div class="dv-chips"><a href="/dive" class="on">전체</a>${MONTH_LABELS.map((l, m) => `<a href="/dive?month=${m + 1}">${l}</a>`).join("")}</div></div></nav>
<main class="dv-wrap"><p class="dv-count">전체 ${points.length}곳</p><div class="dv-grid">${points.map((p) => card(p, "h2")).join("")}</div>
<p class="dv-disclaimer">${esc(DISCLAIMER)}</p></main></div>`;
}

export { DIVE_INDEX_META };
