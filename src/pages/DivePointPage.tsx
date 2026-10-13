import { lazy, Suspense, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAppData } from "@/contexts/AppDataContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { DIVE_CSS } from "@/content/divePageStyles";
import { handleImageFallback } from "@/lib/image";
import {
  DIVE_GUIDE_INDEXABLE,
  allDivePoints,
  divePointMeta,
  divePointPath,
  formatMonthRanges,
  getDivePoint,
  isRelatedTour,
  isSameCountryTour,
  recommendedMonths,
  searchQueryFor,
  splitPointTag,
  splitRegion,
  stripExample,
} from "@/lib/divePointSeo";
import NotFound from "./NotFound";

// 투어 카드는 검색 화면 코드와 같이 묶여 있어 무겁다 — 투어 목록이 실제로 보일 때만 받는다.
const TourCard = lazy(() => import("@/components/search/TourCard").then((m) => ({ default: m.TourCard })));

/**
 * 다이빙 포인트 상세 (/dive/:id).
 * 홈 "다이빙 포인트 가이드" 팝업에만 있던 내용을 검색엔진이 읽을 수 있는 독립 페이지로 연다.
 * 빌드 시 scripts/prerender-dive.mjs가 같은 내용을 정적 HTML로도 만들어 둔다(네이버 등 JS를
 * 잘 실행하지 않는 크롤러용) — 이 화면 마크업을 바꾸면 src/lib/diveStaticHtml.ts도 맞춰 준다.
 */
export default function DivePointPage() {
  const { id } = useParams();
  const point = getDivePoint(id);
  const { tours } = useAppData();

  usePageMeta(point ? { ...divePointMeta(point), noindex: !DIVE_GUIDE_INDEXABLE } : null);

  const { related, sameCountry } = useMemo(() => {
    if (!point) return { related: [], sameCountry: [] };
    const open = tours.filter((t) => !t.adminStatus && t.status === "open");
    const related = open.filter((t) => isRelatedTour(point, t));
    const sameCountry = related.length ? [] : open.filter((t) => isSameCountryTour(point, t));
    return { related: related.slice(0, 6), sameCountry: sameCountry.slice(0, 6) };
  }, [point, tours]);

  const sameSeason = useMemo(() => {
    if (!point) return [];
    const mine = new Set(recommendedMonths(point.id));
    return allDivePoints()
      .filter((p) => p.id !== point.id && recommendedMonths(p.id).some((m) => mine.has(m)))
      .slice(0, 6);
  }, [point]);

  if (!point) return <NotFound />;

  const { country } = splitRegion(point.region);
  const season = formatMonthRanges(recommendedMonths(point.id));
  const shownTours = related.length ? related : sameCountry;

  return (
    <div className="dv">
      <style>{DIVE_CSS}</style>
      <header className="dv-bar">
        <div className="dv-wrap">
          <Link to="/dive" className="dv-back">← 다이빙 포인트 가이드</Link>
          <Link to="/" className="dv-brand">ALL BLUE<span>올블루</span></Link>
        </div>
      </header>

      <section className="dv-hero">
        <img src={point.image} alt={`${point.region} 다이빙`} fetchPriority="high" onError={handleImageFallback} />
        <div className="dv-wrap">
          <p className="dv-eyebrow light">{country ?? "다이빙 포인트 가이드"}</p>
          <h1>{point.region} 다이빙</h1>
          <p className="dv-hook">{point.hook}</p>
          {season && <span className="dv-season">추천 시기 · {season}</span>}
        </div>
      </section>

      <main className="dv-wrap">
        <dl className="dv-facts">
          {season && <div><dt>추천 시기</dt><dd>{season}</dd></div>}
          <div><dt>수온 · 시야</dt><dd>{stripExample(point.water)}</dd></div>
          <div><dt>추천 레벨</dt><dd>{stripExample(point.level)}</dd></div>
          {point.access && <div><dt>가는 길</dt><dd>{stripExample(point.access)}</dd></div>}
        </dl>

        <section className="dv-sec">
          <h2>{point.region}, 이런 바다입니다</h2>
          <p className="dv-lead">{point.oneLiner}</p>
          <p className="dv-p">{point.detail}</p>
          {point.special && (
            <p className="dv-note">
              ⚠️ 민물·동굴·화산호수·아이스 등 특수 다이빙입니다. 일반 오픈워터 자격만으로는 참여가 제한될 수 있고,
              케이브·드라이슈트·아이스 다이빙 등 별도 교육과 장비가 필요할 수 있습니다.
            </p>
          )}
        </section>

        <section className="dv-sec">
          <h2>대표 다이빙 포인트</h2>
          <ol className="dv-points">
            {point.points.map((pt, i) => {
              const { tag, text } = splitPointTag(pt.desc);
              return (
                <li key={pt.name}>
                  <span className="dv-n">{i + 1}</span>
                  <b>{pt.name}{tag && <span className="dv-tag">{tag}</span>}</b>
                  <span className="dv-d">{text}</span>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="dv-sec">
          <h2>만날 수 있는 해양생물</h2>
          <ul className="dv-chips">
            {point.life.map((l) => <li key={l}>{l}</li>)}
          </ul>
        </section>

        {point.gallery.length > 0 && (
          <section className="dv-sec">
            <div className="dv-gallery">
              {point.gallery.map((src) => (
                <img key={src} src={src} alt="" loading="lazy" onError={handleImageFallback} />
              ))}
            </div>
          </section>
        )}

        <section className="dv-sec">
          <h2>{related.length ? `${point.region} 투어` : country ? `${country} 다이빙 투어` : "모집중인 투어"}</h2>
          {shownTours.length > 0 ? (
            <Suspense fallback={null}>
              <div className="dv-tours">
                {shownTours.map((t) => <TourCard key={t.id} tour={t} />)}
              </div>
            </Suspense>
          ) : (
            <p className="dv-empty">
              지금 모집 중인 {point.region} 투어가 없습니다. 비슷한 시기의 다른 투어를 찾아보세요.
            </p>
          )}
          <Link className="dv-cta" to={`/search?q=${encodeURIComponent(searchQueryFor(point))}`}>
            {related.length ? "이 지역 투어 더 보기" : "투어 찾아보기"} →
          </Link>
        </section>

        {sameSeason.length > 0 && (
          <section className="dv-sec">
            <h2>같은 시기에 좋은 다이빙 포인트</h2>
            <div className="dv-grid">
              {sameSeason.map((p) => (
                <Link key={p.id} to={divePointPath(p.id)} className="dv-card">
                  <img src={p.image} alt={`${p.region} 다이빙`} loading="lazy" onError={handleImageFallback} />
                  <div className="dv-card-b">
                    <span className="dv-card-r">{p.region}</span>
                    <p className="dv-card-h">{p.hook}</p>
                    <span className="dv-card-s">{formatMonthRanges(recommendedMonths(p.id))}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <p className="dv-disclaimer">
          시즌·수온·시야·해양생물 정보는 다이빙 업계 자료를 참고한 일반적인 안내이며, 해마다 조건이 달라질 수 있습니다.
          실제 일정은 각 투어 상세의 강사 안내를 확인해 주세요.
        </p>
        <div className="dv-foot-space" />
      </main>
      <BottomNav />
    </div>
  );
}
