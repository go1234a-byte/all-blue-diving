// 크롤러가 JS 실행 없이 읽을 본문(h1·글·링크)을 만든다. React가 켜지면 #root 안의 이 내용은 통째로 교체된다.
// 순수 함수만 둔다(테스트: tests/seoPage.test.ts).
import { escapeHtml, SITE_URL } from "./seo.js";

const STYLE =
  "max-width:720px;margin:0 auto;padding:24px 16px;font-family:Pretendard,-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#14263A;line-height:1.6";

const won = (n) => `${Number(n).toLocaleString("ko-KR")}원`;
const PLATFORM_FEE_RATE = 0.1; // src/lib/pricing.ts의 applyPlatformFee와 같은 계산
const displayPrice = (base) => base + Math.round(base * PLATFORM_FEE_RATE);
const dateOnly = (iso) => String(iso ?? "").slice(0, 10);

/** index.html의 빈 #root 안에 본문을 넣는다. */
export function injectBody(html, innerHtml) {
  return html.replace('<div id="root"></div>', `<div id="root"><main style="${STYLE}">${innerHtml}</main></div>`);
}

/** 샘플(시연용) 투어는 검색 노출용 목록에 넣지 않는다. src/lib/sampleContent.ts와 같은 기준. */
export const isSampleTitle = (title) => String(title ?? "").includes("(샘플");

export function tourListHtml(tours) {
  const rows = tours
    .filter((t) => !isSampleTitle(t.title))
    .map(
      (t) =>
        `<li><a href="${SITE_URL}/tour/${escapeHtml(t.id)}">${escapeHtml(t.title)}</a> — ${escapeHtml(t.country)} · ${escapeHtml(t.site)}, ${escapeHtml(dateOnly(t.start_date))} ~ ${escapeHtml(dateOnly(t.end_date))}, ${won(displayPrice(t.base_price))}~</li>`,
    );
  return rows.length ? `<ul>${rows.join("")}</ul>` : "<p>현재 모집 중인 투어를 준비하고 있습니다.</p>";
}

export function homeHtml(tours) {
  return `<h1>ALL BLUE — 모든 바다가 만나는 곳</h1>
<p>자격과 경력을 검증한 강사의 스쿠버다이빙·프리다이빙·리브어보드 투어를 한 곳에서 비교하고 예약하는 다이빙 투어 플랫폼입니다.</p>
<h2>모집 중인 다이빙 투어</h2>${tourListHtml(tours)}
<p><a href="${SITE_URL}/search">전체 투어 검색</a> · <a href="${SITE_URL}/guide">다이빙 기초·안전 가이드</a></p>`;
}

export function searchHtml(tours) {
  return `<h1>다이빙 투어 검색</h1>
<p>나라·월·종류(스쿠버/프리다이빙)별로 모집 중인 다이빙 투어를 비교하세요.</p>${tourListHtml(tours)}`;
}

export function guideHtml(articles, notice) {
  const items = articles
    .map((a) => {
      const sources = a.sources.length
        ? `<p>출처: ${a.sources.map((s) => `<a href="${escapeHtml(s.url)}" rel="noopener nofollow">${escapeHtml(s.label)}</a>`).join(", ")} (확인일 ${escapeHtml(a.checkedAt)})</p>`
        : `<p>올블루 편집 (확인일 ${escapeHtml(a.checkedAt)})</p>`;
      return `<article><h2>${escapeHtml(a.title)}</h2><p>${escapeHtml(a.summary)}</p>${a.body.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}${sources}</article>`;
    })
    .join("");
  return `<h1>다이빙 기초·안전 가이드</h1><p>${escapeHtml(notice)}</p>${items}`;
}

export function tourBodyHtml(tour, description) {
  const place = [tour.site, tour.country].filter(Boolean).join(", ");
  return `<h1>${escapeHtml(tour.title)}</h1>
<p>${escapeHtml(place)} · ${escapeHtml(dateOnly(tour.start_date))} ~ ${escapeHtml(dateOnly(tour.end_date))}${typeof tour.base_price === "number" ? ` · ${won(displayPrice(tour.base_price))}~` : ""}</p>
${description ? `<p>${escapeHtml(description)}</p>` : ""}
<p><a href="${SITE_URL}/search">다른 다이빙 투어 보기</a></p>`;
}
