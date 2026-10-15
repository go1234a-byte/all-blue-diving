// ALL BLUE — 강사 공개 프로필(/instructor/:id/profile) 첫 HTML을 그 강사 전용 head로
// 바꿔 주는 Vercel Serverless Function. api/og/tour/[id].js와 같은 방식이다.
// 검색엔진에는 강사별 고유 제목·설명·canonical과 ProfilePage 구조화 데이터를,
// 카카오톡 등 공유 미리보기에는 강사 사진을 준다.

import {
  SITE_URL,
  ORGANIZATION_REF,
  absUrl,
  injectHead,
  notFoundHtml,
  readIndexHtml,
  sendHtml,
  supabaseRows,
  toDescription,
} from "../../_lib/seo.js";

async function fetchInstructor(id) {
  const rows = await supabaseRows(
    `instructors?id=eq.${encodeURIComponent(id)}&select=id,name,bio,avatar_url,agency,level,languages,specialty_tags,experience_years,verified_status,sns_instagram,sns_youtube,sns_facebook,sns_blog,sns_homepage`,
  );
  return rows[0] ?? null;
}

function buildMeta(ins) {
  const url = `${SITE_URL}/instructor/${ins.id}/profile`;
  const credential = [ins.agency, ins.level].filter(Boolean).join(" ");
  const title = `${ins.name} 강사 프로필 | ALL BLUE`;
  const description =
    toDescription(ins.bio) ||
    `${credential ? `${credential} ` : ""}${ins.name} 강사의 다이빙 투어와 후기를 ALL BLUE에서 확인해보세요.`;
  const sameAs = [ins.sns_instagram, ins.sns_youtube, ins.sns_facebook, ins.sns_blog, ins.sns_homepage].filter(
    (u) => typeof u === "string" && /^https?:\/\//.test(u),
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url,
    mainEntity: {
      "@type": "Person",
      "@id": `${url}#person`,
      name: ins.name,
      description,
      ...(ins.avatar_url ? { image: absUrl(ins.avatar_url) } : {}),
      ...(credential ? { jobTitle: `${credential} 다이빙 강사` } : { jobTitle: "다이빙 강사" }),
      ...(ins.languages?.length ? { knowsLanguage: ins.languages } : {}),
      ...(ins.specialty_tags?.length ? { knowsAbout: ins.specialty_tags } : {}),
      ...(sameAs.length ? { sameAs } : {}),
      affiliation: ORGANIZATION_REF,
    },
  };

  return {
    title,
    description,
    url,
    image: ins.avatar_url ? absUrl(ins.avatar_url) : undefined,
    ogType: "profile",
    jsonLd,
    // 미인증 강사는 사이트맵에서 빠져 있다 — 같은 기준으로 색인도 막는다.
    noindex: !ins.verified_status,
  };
}

export default async function handler(req, res) {
  const { id } = req.query;

  let html;
  try {
    html = readIndexHtml();
  } catch {
    res.status(500).send("index.html not found");
    return;
  }

  try {
    // 형식부터 틀린 주소는 조회할 필요도 없이 없는 페이지다.
    const ins = typeof id !== "string" || id.trim() === "" ? null : await fetchInstructor(id);
    if (!ins) {
      // DB에 없음 = 삭제됐거나 잘못된 주소 → 진짜 404 (검색엔진이 색인에서 빨리 뺀다).
      sendHtml(res, notFoundHtml(html), 404);
      return;
    }
    html = injectHead(html, buildMeta(ins));
  } catch (error) {
    // 조회 실패(일시 장애 등)는 "없음"이 아니다 — 기본 메타태그로 200 응답. 단 index.html의
    // canonical(홈)은 빼야 한다 — 남겨 두면 검색엔진이 이 페이지를 홈의 중복으로 오해한다.
    html = html.replace(/\s*<link rel="canonical"[^>]*>/, "");
    console.error("[api/og/instructor] 강사 조회 실패, 기본 메타태그로 응답:", error);
  }

  sendHtml(res, html);
}
