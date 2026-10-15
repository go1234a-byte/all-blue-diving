// ALL BLUE — 투어 상세(/tour/:id) 첫 HTML을 그 투어 전용 head로 바꿔 주는 Vercel Serverless Function.
//
// 1) 카카오톡/페이스북 공유 시 앱 기본 og:image 대신 그 투어의 실제 사진/제목이 뜨게 하고,
// 2) 검색엔진에는 투어별 고유 제목·설명·canonical과 구조화 데이터(TouristTrip,
//    BreadcrumbList)를 JS 실행 전 첫 HTML에서 바로 준다.
// vercel.json에서 /tour/:id 요청을 이 함수로 라우팅한다. 본문·스크립트는 빌드된
// index.html 그대로라 화면 동작은 완전히 동일하다.

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

// src/lib/pricing.ts의 applyPlatformFee와 같은 계산 — 화면에 보이는 가격과 맞춘다.
const PLATFORM_FEE_RATE = 0.1;
const displayPrice = (base) => base + Math.round(base * PLATFORM_FEE_RATE);

const ACTIVITY_LABEL = { scuba: "Scuba diving", freediving: "Freediving", liveaboard: "Liveaboard diving" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function fetchTour(id) {
  const rows = await supabaseRows(
    `tours?id=eq.${encodeURIComponent(id)}&select=id,title,country,site,description,main_image_url,gallery_urls,base_price,start_date,end_date,recruitment_deadline,status,cancelled_at,admin_status,activity_types`,
  );
  return rows[0] ?? null;
}

function buildMeta(tour) {
  const url = `${SITE_URL}/tour/${tour.id}`;
  const title = `${tour.title} | ALL BLUE`;
  const description =
    toDescription(tour.description) ||
    `${tour.country} · ${tour.site}에서 떠나는 다이빙 투어를 ALL BLUE에서 확인해보세요.`;
  const images = [tour.main_image_url, ...(tour.gallery_urls ?? [])].filter(Boolean).map(absUrl).slice(0, 5);
  // 취소되거나 관리자가 정지/보류한 투어는 사이트맵에서 빠지는 것과 같은 기준으로 색인도 막는다.
  const hidden = Boolean(tour.cancelled_at || tour.admin_status);
  const isOpen = tour.status === "open" && !hidden;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TouristTrip",
        "@id": `${url}#trip`,
        name: tour.title,
        description,
        url,
        ...(images.length ? { image: images } : {}),
        touristType: [...new Set((tour.activity_types ?? []).map((a) => ACTIVITY_LABEL[a]).filter(Boolean))],
        ...(tour.start_date ? { startDate: tour.start_date } : {}),
        ...(tour.end_date ? { endDate: tour.end_date } : {}),
        itinerary: {
          "@type": "Place",
          // addressCountry는 ISO 국가코드를 기대하는데 DB엔 한글 국가명이 들어 있어 이름으로만 표기한다.
          name: [tour.site, tour.country].filter(Boolean).join(", "),
        },
        provider: ORGANIZATION_REF,
        ...(typeof tour.base_price === "number"
          ? {
              offers: {
                "@type": "Offer",
                url,
                price: displayPrice(tour.base_price),
                priceCurrency: "KRW",
                availability: isOpen ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
                ...(tour.recruitment_deadline ? { validThrough: tour.recruitment_deadline } : {}),
              },
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "투어 검색", item: `${SITE_URL}/search` },
          { "@type": "ListItem", position: 3, name: tour.title, item: url },
        ],
      },
    ],
  };

  return { title, description, url, image: absUrl(tour.main_image_url), jsonLd, noindex: hidden };
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
    const tour = typeof id !== "string" || !UUID_RE.test(id) ? null : await fetchTour(id);
    if (!tour) {
      // DB에 없음 = 삭제됐거나 잘못된 주소 → 진짜 404 (검색엔진이 색인에서 빨리 뺀다).
      sendHtml(res, notFoundHtml(html), 404);
      return;
    }
    html = injectHead(html, buildMeta(tour));
  } catch (error) {
    // 조회 실패(일시 장애 등)는 "없음"이 아니다 — 기본 메타태그로 200 응답. 단 index.html의
    // canonical(홈)은 빼야 한다 — 남겨 두면 검색엔진이 이 페이지를 홈의 중복으로 오해한다.
    html = html.replace(/\s*<link rel="canonical"[^>]*>/, "");
    console.error("[api/og/tour] tour 조회 실패, 기본 메타태그로 응답:", error);
  }

  sendHtml(res, html);
}
