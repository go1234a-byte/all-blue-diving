// ALL BLUE — 홈(/)·검색(/search)·가이드(/guide)의 첫 HTML에 크롤러가 읽을 본문을 넣어 주는 Vercel Function.
// 화면 동작은 그대로다(빌드된 index.html + 본문만 추가, React가 켜지면 본문이 교체된다).
import { notFoundHtml, readIndexHtml, sendHtml, supabaseRows, SITE_URL, injectHead } from "./_lib/seo.js";
import { DIVE_BASICS, DIVE_BASICS_NOTICE } from "./_lib/crawlData.js";
import { guideHtml, homeHtml, injectBody, searchHtml } from "./_lib/pageHtml.js";

const META = {
  home: { path: "/", title: "ALL BLUE - 모든 바다가 만나는 곳", description: "전 세계 스쿠버다이빙 & 프리다이빙 투어를 한 곳에서 비교하고 예약하세요." },
  search: { path: "/search", title: "다이빙 투어 검색 | ALL BLUE", description: "나라·월·활동(스쿠버/프리다이빙)별로 전 세계 다이빙 투어를 비교하고 바로 예약하세요." },
  guide: { path: "/guide", title: "다이빙 기초·안전 가이드 | ALL BLUE", description: "오픈워터와 어드밴스드의 차이, 준비물, 비행 전 휴식까지 처음 다이빙하는 분을 위한 기초·안전 가이드." },
};

// 지난 투어·취소·정지·샘플은 뺀다(사이트맵과 같은 기준).
const OPEN_TOURS_QUERY =
  "tours?status=eq.open&cancelled_at=is.null&admin_status=is.null&title=not.ilike.*%28%EC%83%98%ED%94%8C*" +
  `&start_date=gte.${new Date().toISOString().slice(0, 10)}` +
  "&select=id,title,country,site,start_date,end_date,base_price&order=start_date.asc&limit=60";

export default async function handler(req, res) {
  const key = String(req.query.p ?? "");
  const meta = META[key];
  let html;
  try {
    html = readIndexHtml();
  } catch {
    res.status(500).send("index.html not found");
    return;
  }
  if (!meta) {
    sendHtml(res, notFoundHtml(html), 404);
    return;
  }
  try {
    let body;
    if (key === "guide") body = guideHtml(DIVE_BASICS, DIVE_BASICS_NOTICE);
    else {
      const tours = await supabaseRows(OPEN_TOURS_QUERY);
      body = key === "home" ? homeHtml(tours) : searchHtml(tours);
    }
    html = injectHead(html, { title: meta.title, description: meta.description, url: `${SITE_URL}${meta.path}` });
    html = injectBody(html, body);
  } catch (error) {
    // 조회 실패여도 기본 화면은 정상 응답 — 본문만 없다.
    console.error("[api/page] 본문 생성 실패, 기본 HTML로 응답:", error);
  }
  sendHtml(res, html);
}
