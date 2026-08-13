// ALL BLUE — 투어 상세(/tour/:id) 링크를 카카오톡 등에 공유했을 때, 앱 공통 기본
// og:image 대신 그 투어의 실제 사진/제목이 뜨게 하는 Vercel Serverless Function.
//
// 이 프로젝트는 SSR이 없는 순수 SPA(Vite)라 og:image 등 메타태그가 index.html에
// 고정돼 있었다. vercel.json에서 /tour/:id 요청을 전부 이 함수로 라우팅하고, 여기서
// 실제 빌드된 index.html을 읽어와 그 투어에 맞는 메타태그로 바꿔서 그대로 돌려준다 —
// 사람이 보든 카카오/페이스북 크롤러가 보든 스크립트 태그 등은 100% 동일한 index.html이라
// 화면 동작은 완전히 그대로고, 메타태그만 요청 시점에 그 투어 걸로 바뀌어 있는 셈이다.

import fs from "fs";
import path from "path";

const SUPABASE_URL = "https://fffslvvligcpadkcyzvo.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZnNsdnZsaWdjcGFka2N5enZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0ODExNDQsImV4cCI6MjEwMDA1NzE0NH0.Z0jo-JkL35Bxw9B4W4xlTG-1EkNRXyToqm0OyLHKzQI";

const DEFAULT_OG_IMAGE = "https://allbluedive.com/og-image.png";

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function fetchTour(id) {
  const url = `${SUPABASE_URL}/rest/v1/tours?id=eq.${encodeURIComponent(id)}&select=title,country,site,main_image_url`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] ?? null;
}

function injectTourMeta(html, tour) {
  const title = `${tour.title} | ALL BLUE`;
  const description = `${tour.country} · ${tour.site}에서 떠나는 다이빙 투어를 ALL BLUE에서 확인해보세요.`;
  const image = tour.main_image_url || DEFAULT_OG_IMAGE;

  return html
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(
      /<meta name="description" content=".*?" \/>/,
      `<meta name="description" content="${escapeHtml(description)}" />`,
    )
    .replace(
      /<meta property="og:title" content=".*?" \/>/,
      `<meta property="og:title" content="${escapeHtml(title)}" />`,
    )
    .replace(
      /<meta property="og:description"\s*content=".*?" \/>/,
      `<meta property="og:description" content="${escapeHtml(description)}" />`,
    )
    .replace(
      /<meta property="og:image"\s*content=".*?" \/>/,
      `<meta property="og:image" content="${escapeHtml(image)}" />`,
    )
    // 투어 사진은 og-image.png(1200x1200)와 실제 크기/비율이 달라서, 고정 width/height를
    // 그대로 두면 카카오/페이스북이 잘못된 비율로 미리보기를 자를 수 있다 — 지워서
    // 크롤러가 실제 이미지 크기를 스스로 읽게 한다.
    .replace(/<meta property="og:image:width" content="\d+" \/>\s*/, "")
    .replace(/<meta property="og:image:height" content="\d+" \/>\s*/, "");
}

export default async function handler(req, res) {
  const { id } = req.query;
  const indexPath = path.join(process.cwd(), "dist", "index.html");

  let html;
  try {
    html = fs.readFileSync(indexPath, "utf-8");
  } catch {
    res.status(500).send("index.html not found");
    return;
  }

  try {
    const tour = typeof id === "string" ? await fetchTour(id) : null;
    if (tour) {
      html = injectTourMeta(html, tour);
    }
  } catch (error) {
    console.error("[api/og/tour] tour 조회 실패, 기본 메타태그로 응답:", error);
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=86400");
  res.status(200).send(html);
}
