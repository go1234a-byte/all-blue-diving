// ALL BLUE — /sitemap.xml을 실제 XML로 반환하는 Vercel Serverless Function.
//
// 이 프로젝트는 SSR이 없는 순수 SPA(Vite)라 vercel.json의 catch-all rewrite가
// /sitemap.xml 요청까지 index.html(SPA 폴백)로 돌려버려서, 검색엔진이 사이트맵을
// text/html로 받아 파싱에 실패하는 상태였다. api/og/tour/[id].js와 동일하게 Supabase
// REST를 anon key로 직접 호출해 공개 투어/강사 목록을 모아 실제 XML로 응답한다.

const SUPABASE_URL = "https://fffslvvligcpadkcyzvo.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZnNsdnZsaWdjcGFka2N5enZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0ODExNDQsImV4cCI6MjEwMDA1NzE0NH0.Z0jo-JkL35Bxw9B4W4xlTG-1EkNRXyToqm0OyLHKzQI";

const BASE_URL = "https://allbluedive.com";

const STATIC_ROUTES = [
  { path: "/", priority: "1.0" },
  { path: "/search", priority: "0.8" },
  { path: "/terms", priority: "0.2" },
  { path: "/privacy", priority: "0.2" },
  { path: "/refund-policy", priority: "0.2" },
];

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) return [];
  return res.json();
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function urlEntry(loc, { lastmod, priority } = {}) {
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>` : "",
    priority ? `    <priority>${priority}</priority>` : "",
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

export default async function handler(req, res) {
  // 취소되거나(cancelled_at) 관리자가 정지/보류(admin_status)한 투어는 검색 노출에서
  // 이미 제외되는 것과 동일한 기준으로 사이트맵에서도 뺀다.
  const [tours, instructors] = await Promise.all([
    fetchJson(
      `${SUPABASE_URL}/rest/v1/tours?cancelled_at=is.null&admin_status=is.null&select=id,created_at`,
    ),
    fetchJson(
      `${SUPABASE_URL}/rest/v1/instructors?verified_status=eq.true&select=id,created_at`,
    ),
  ]);

  const entries = [
    ...STATIC_ROUTES.map((r) => urlEntry(`${BASE_URL}${r.path}`, { priority: r.priority })),
    ...tours.map((t) =>
      urlEntry(`${BASE_URL}/tour/${t.id}`, { lastmod: t.created_at, priority: "0.9" }),
    ),
    ...instructors.map((i) =>
      urlEntry(`${BASE_URL}/instructor/${i.id}/profile`, { lastmod: i.created_at, priority: "0.6" }),
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  res.status(200).send(xml);
}
