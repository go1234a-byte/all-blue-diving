import { useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import { DIVE_CSS } from "@/content/divePageStyles";
import { GUIDE_BY_MONTH } from "@/content/divePointGuide";
import { handleImageFallback } from "@/lib/image";
import {
  DIVE_GUIDE_INDEXABLE,
  DIVE_INDEX_META,
  MONTH_LABELS,
  allDivePoints,
  divePointPath,
  formatMonthRanges,
  getDivePoint,
  recommendedMonths,
} from "@/lib/divePointSeo";

/**
 * 다이빙 포인트 가이드 목록 (/dive, /dive?month=3).
 * 월 칩으로 거르면 홈 가이드와 같은 순서(GUIDE_BY_MONTH)로, 전체 보기면 데이터 순서로 보여준다.
 * 정적 HTML(scripts/prerender-dive.mjs)은 "전체"를 그린다 — 크롤러가 56곳 링크를 모두 보게.
 */
export default function DiveGuideIndex() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("month");
  const month = raw !== null && /^(1[0-2]|[1-9])$/.test(raw) ? Number(raw) - 1 : null;

  usePageMeta({ ...DIVE_INDEX_META, noindex: !DIVE_GUIDE_INDEXABLE });

  const points = useMemo(
    () =>
      month === null
        ? allDivePoints()
        : GUIDE_BY_MONTH[month].map((id) => getDivePoint(id)).filter((p): p is NonNullable<typeof p> => !!p),
    [month],
  );

  // 모바일에선 월 칩이 가로 스크롤이라, 고른 달(예: ?month=8로 들어온 경우)이 화면 밖에 있을 수 있다.
  const activeChip = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    activeChip.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [month]);

  const pick = (m: number | null) => {
    const next = new URLSearchParams(params);
    if (m === null) next.delete("month");
    else next.set("month", String(m + 1));
    setParams(next, { replace: true });
  };

  return (
    <div className="dv">
      <style>{DIVE_CSS}</style>
      <header className="dv-bar">
        <div className="dv-wrap">
          <Link to="/" className="dv-back">← 홈</Link>
          <Link to="/" className="dv-brand">ALL BLUE<span>올블루</span></Link>
        </div>
      </header>

      <section className="dv-index-head">
        <div className="dv-wrap">
          <p className="dv-eyebrow light">DIVE POINT GUIDE</p>
          <h1>언제, 어디로 다이빙을 떠날까요</h1>
          <p>국내외 다이빙 포인트 {allDivePoints().length}곳의 시즌·수온·해양생물·추천 레벨을 정리했습니다. 떠나고 싶은 달을 고르면 그때 좋은 바다만 모아 보여드립니다.</p>
        </div>
      </section>

      <nav className="dv-months" aria-label="월 선택">
        <div className="dv-wrap">
          <div className="dv-chips">
            <button
              type="button"
              ref={month === null ? activeChip : undefined}
              className={month === null ? "on" : undefined}
              onClick={() => pick(null)}
            >
              전체
            </button>
            {MONTH_LABELS.map((label, m) => (
              <button
                key={label}
                type="button"
                ref={month === m ? activeChip : undefined}
                className={month === m ? "on" : undefined}
                onClick={() => pick(m)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="dv-wrap">
        <p className="dv-count">
          {month === null ? `전체 ${points.length}곳` : `${MONTH_LABELS[month]}에 좋은 곳 ${points.length}곳`}
        </p>
        <div className="dv-grid">
          {points.map((p) => (
            <Link key={p.id} to={divePointPath(p.id)} className="dv-card">
              <img src={p.image} alt={`${p.region} 다이빙`} loading="lazy" onError={handleImageFallback} />
              <div className="dv-card-b">
                <span className="dv-card-r">{p.region}</span>
                <h2 className="dv-card-h">{p.hook}</h2>
                <span className="dv-card-s">추천 시기 · {formatMonthRanges(recommendedMonths(p.id))}</span>
                {p.special && <span className="dv-card-sp">특수 다이빙</span>}
              </div>
            </Link>
          ))}
        </div>
        <p className="dv-disclaimer">
          시즌·수온·시야·해양생물 정보는 다이빙 업계 자료를 참고한 일반적인 안내이며, 해마다 조건이 달라질 수 있습니다.
        </p>
        <div className="dv-foot-space" />
      </main>
      <BottomNav />
    </div>
  );
}
