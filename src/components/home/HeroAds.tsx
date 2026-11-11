import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HOME_ADS, type HomeAd } from "@/content/homeAds";

const INTERVAL_MS = 6500;

/**
 * 홈 첫 화면 자체가 광고판: 사진이 화면 전체를 덮고, 큰 광고 문구·버튼이 첫 화면의 주인공이다(팝업·작은 카드가 아님).
 * 검색은 그 아래에 children 으로 붙는다. 사진 레이어는 hero 전체 크기(position:absolute)라 광고가 바뀌어도 높이는 변하지 않는다.
 * 페이지 제목(h1)은 검색엔진·스크린리더용으로 화면 밖에 둔다.
 */
export function HeroAds({ ads = HOME_ADS, children }: { ads?: HomeAd[]; children: ReactNode }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const reduce = useRef(typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  const go = useCallback((n: number) => setI((n + ads.length) % ads.length), [ads.length]);

  // key={i} 로 진행 막대가 슬라이드마다 처음부터 다시 차오른다. 일시정지/되감기는 i 가 바뀔 때 타이머를 새로 건다.
  useEffect(() => {
    if (paused || reduce.current || ads.length < 2) return;
    const t = window.setTimeout(() => setI((p) => (p + 1) % ads.length), INTERVAL_MS);
    return () => window.clearTimeout(t);
  }, [i, paused, ads.length]);

  const ad = ads[i];
  const animate = !paused && !reduce.current && ads.length > 1;

  return (
    <>
      <style>{CSS}</style>
      <div className="hb-ph" aria-hidden="true">
        {ads.map((a, k) => (
          <img key={a.id} src={a.photo} alt="" className={k === i ? "on" : ""} style={{ objectPosition: a.position }} loading={k === 0 ? "eager" : "lazy"} decoding="async" {...(k === 0 ? { fetchPriority: "high" as const } : {})} />
        ))}
      </div>

      <div
        className="hb-top"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="hb-bars" role="group" aria-label="광고 선택">
          {ads.map((a, k) => (
            <button key={a.id} type="button" className={`hb-bar${k < i ? " done" : ""}${k === i ? " cur" : ""}`} aria-label={`${k + 1}번째 광고 보기`} aria-current={k === i} onClick={() => go(k)}>
              <i style={k === i && animate ? { animationDuration: `${INTERVAL_MS}ms` } : undefined} key={k === i ? `c${i}` : `n${k}`} />
            </button>
          ))}
        </div>
      </div>

      <div
        className="ab-hero2-inner"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
        }}
      >
        <h1 className="hb-sr">ALL BLUE — 검증된 강사와 떠나는 다이빙 투어</h1>
        <aside className="hb-ad" aria-label="광고" aria-roledescription="광고 슬라이드">
          <p className="hb-meta">
            <span className="hb-tag">광고{ad.sample ? " · 예시" : ""}</span>
            <span>{ad.category}</span>
          </p>
          <p className="hb-h">{ad.headline}</p>
          <p className="hb-sub">{ad.sub}</p>
          <Link to={ad.href} className="hb-cta">{ad.cta} <ChevronRight aria-hidden="true" /></Link>
        </aside>
        {children}
      </div>

      {ads.length > 1 && (
        <>
          <button type="button" className="hb-arrow prev" aria-label="이전 광고" onClick={() => go(i - 1)}><ChevronLeft aria-hidden="true" /></button>
          <button type="button" className="hb-arrow next" aria-label="다음 광고" onClick={() => go(i + 1)}><ChevronRight aria-hidden="true" /></button>
        </>
      )}
    </>
  );
}

const CSS = `
.hb-ph{position:absolute;inset:0;}
.hb-ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .9s ease;}
.hb-ph img.on{opacity:1;}
.hb-ph::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,20,36,.55) 0%,rgba(6,20,36,.28) 38%,rgba(6,20,36,.78) 100%);}
.hb-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}
.hb-top{position:absolute;z-index:3;left:var(--gut);right:var(--gut);top:calc(62px + env(safe-area-inset-top));}
.hb-bars{display:flex;gap:6px;max-width:var(--maxw);margin:0 auto;}
.hb-bar{position:relative;flex:1;height:18px;border:0;background:none;padding:0;cursor:pointer;}
.hb-bar::before{content:"";position:absolute;left:0;right:0;top:8px;height:3px;border-radius:2px;background:rgba(255,255,255,.35);}
.hb-bar i{position:absolute;left:0;top:8px;height:3px;border-radius:2px;background:#fff;width:0;}
.hb-bar.done i{width:100%;}
.hb-bar.cur i{width:100%;animation:hbfill linear forwards;}
@keyframes hbfill{from{width:0}to{width:100%}}
.hb-ad{color:#fff;max-width:760px !important;}
.hb-meta{display:flex;align-items:center;gap:10px;margin:0 0 12px;font-size:.8125rem;color:rgba(255,255,255,.9);}
.hb-tag{background:#fff;color:#0A1B2E;font-weight:800;border-radius:6px;padding:2px 9px;}
.hb-h{margin:0;font-size:clamp(2.25rem,1rem + 4.6vw,5rem);font-weight:800;line-height:1.08;letter-spacing:-.035em;word-break:keep-all;text-wrap:balance;max-width:14ch;}
.hb-sub{margin:14px 0 0;font-size:1.0625rem;line-height:1.5;color:rgba(255,255,255,.92);max-width:36ch;}
.ab-hero2 .hb-cta{display:inline-flex;align-items:center;gap:4px;margin:18px 0 26px;background:#fff;color:#0A1B2E !important;font-weight:800;font-size:.9375rem;border-radius:999px;padding:12px 18px 12px 20px;}
.hb-cta svg{width:18px;height:18px;color:#0A1B2E;}
.ab-hero2 .hb-cta:hover{background:#E8F4F7;}
.hb-arrow{position:absolute;z-index:3;top:44%;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.4);background:rgba(6,20,36,.4);color:#fff;display:none;place-items:center;cursor:pointer;}
.hb-arrow.prev{left:18px}.hb-arrow.next{right:18px}
.hb-arrow svg{width:22px;height:22px;}
@media(min-width:900px){.hb-arrow{display:grid;}}
.hb-cta:focus-visible,.hb-bar:focus-visible,.hb-arrow:focus-visible{outline:2px solid #5FD0E0;outline-offset:3px;}
@media(max-width:640px){.hb-cta{margin-bottom:22px;}.hb-sub{font-size:.9375rem;}}
@media(prefers-reduced-motion:reduce){.hb-ph img{transition:none;}.hb-bar.cur i{animation:none;}}
`;
