import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { HOME_ADS, type HomeAd } from "@/content/homeAds";

const INTERVAL_MS = 6000;

/** 첫 화면 배경 사진을 광고 슬라이드로 돌린다. 사진 레이어는 항상 hero 전체 크기(position:absolute)라 광고가 바뀌어도 hero 높이는 흔들리지 않는다. */
export function HeroAds({ ads = HOME_ADS }: { ads?: HomeAd[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useRef(
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );

  const go = useCallback((n: number) => setI((n + ads.length) % ads.length), [ads.length]);

  useEffect(() => {
    if (paused || reduce.current || ads.length < 2) return;
    const t = window.setInterval(() => setI((p) => (p + 1) % ads.length), INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [paused, ads.length]);

  const ad = ads[i];
  return (
    <>
      <style>{CSS}</style>
      <div className="hads-ph" aria-hidden="true">
        {ads.map((a, k) => (
          <img key={a.id} src={a.photo} alt="" className={k === i ? "on" : ""} style={{ objectPosition: a.position }} loading={k === 0 ? "eager" : "lazy"} decoding="async" {...(k === 0 ? { fetchPriority: "high" as const } : {})} />
        ))}
      </div>
      <aside
        className="hads-card"
        aria-roledescription="광고 슬라이드"
        aria-label="광고"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <p className="hads-meta">
          <span className="hads-tag">광고{ad.sample ? " · 예시" : ""}</span>
          <span>{ad.category}</span>
        </p>
        <p className="hads-h" aria-live={paused ? "polite" : "off"}>{ad.headline}</p>
        <p className="hads-sub">{ad.sub}</p>
        <div className="hads-foot">
          <Link to={ad.href} className="hads-cta">{ad.cta} →</Link>
          <div className="hads-dots" role="group" aria-label="광고 선택">
            {ads.map((a, k) => (
              <button key={a.id} type="button" className={k === i ? "on" : ""} aria-label={`${k + 1}번째 광고 보기`} aria-current={k === i} onClick={() => go(k)} />
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

const CSS = `
.hads-ph{position:absolute;inset:0;}
.hads-ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .9s ease;}
.hads-ph img.on{opacity:1;}
.hads-ph::after{content:"";position:absolute;inset:0;background:rgba(6,20,36,.45);}
.hads-card{position:absolute;z-index:2;left:var(--gut);right:var(--gut);top:calc(72px + env(safe-area-inset-top));max-width:340px;color:#fff;background:rgba(6,20,36,.66);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:12px 14px;}
.hads-meta{display:flex;align-items:center;gap:8px;margin:0 0 6px;font-size:.75rem;color:rgba(255,255,255,.86);}
.hads-tag{background:#fff;color:#0A1B2E;font-weight:800;border-radius:5px;padding:1px 7px;}
.hads-h{margin:0;font-size:1rem;font-weight:700;line-height:1.35;}
.hads-sub{margin:3px 0 0;font-size:.8125rem;line-height:1.45;color:rgba(255,255,255,.86);}
.hads-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;}
.hads-cta{font-size:.8125rem;font-weight:700;color:#fff;border-bottom:1.5px solid #5FD0E0;padding-bottom:1px;}
.hads-dots{display:flex;gap:2px;}
.hads-dots button{width:22px;height:22px;border:0;background:none;padding:0;cursor:pointer;display:grid;place-items:center;}
.hads-dots button::before{content:"";width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.45);}
.hads-dots button.on::before{background:#fff;width:18px;border-radius:4px;}
.hads-card a:focus-visible,.hads-dots button:focus-visible{outline:2px solid #5FD0E0;outline-offset:2px;border-radius:6px;}
@media(min-width:900px){.hads-card{left:auto;right:var(--gut);top:calc(96px + env(safe-area-inset-top));}}
@media(prefers-reduced-motion:reduce){.hads-ph img{transition:none;}}
`;
