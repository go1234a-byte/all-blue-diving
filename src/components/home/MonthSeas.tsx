import { useMemo, useState } from "react";
import { DIVE_POINTS, GUIDE_BY_MONTH, type DivePoint } from "@/content/divePointGuide";
import { handleImageFallback } from "@/lib/image";
import { toursAtPoint } from "@/lib/tours";
import type { Tour } from "@/types";

const SHOWN = 8; // 달마다 보여 줄 바다 수(가이드 목록 앞쪽부터)

interface Props {
  /** 모집 중 투어(isOpenTour 통과분). 지역별 개수에 쓴다. */
  tours: Tour[];
  /** "자세히" — 기존 상세 시트를 연다. */
  onOpenDetail: (pt: DivePoint) => void;
  /** "전체 지역 보기" — 기존 가이드 전체 화면(Explorer)을 연다. */
  onOpenAll: (month: number) => void;
}

/** 홈 "N월에 가기 좋은 바다" — 이번 달부터 3개월 탭, 바다 목록(펼침), 왼쪽 고정 사진. */
export function MonthSeas({ tours, onOpenDetail, onOpenAll }: Props) {
  const now = new Date().getMonth();
  const months = [now, (now + 1) % 12, (now + 2) % 12];
  const [month, setMonth] = useState(now);
  const points = useMemo(
    () => (GUIDE_BY_MONTH[month] ?? []).map((id) => DIVE_POINTS[id]).filter((p): p is DivePoint => Boolean(p)).slice(0, SHOWN),
    [month],
  );
  const counts = useMemo(() => new Map(points.map((p) => [p.id, toursAtPoint(p.region, tours).length])), [points, tours]);
  const [openId, setOpenId] = useState<string | null>(null);
  const active = points.find((p) => p.id === openId) ?? points[0];

  if (!active) return null;
  return (
    <section id="seas" className="ab-seas" aria-labelledby="ab-seas-h">
      <style>{CSS}</style>
      <div className="wrap">
        <div className="ab-seas-head">
          <h2 id="ab-seas-h">{month + 1}월에 가기 좋은 바다</h2>
          <p>월별 시즌 가이드에 지금 모집 중인 투어 수를 붙였어요. 바다를 누르면 생물·레벨·가는 길이 열려요.</p>
        </div>
        <div className="ab-seas-grid">
          <figure className="ab-seas-ph">
            <img key={active.image} src={active.image} alt="" onError={handleImageFallback} loading="lazy" />
            <figcaption>{active.region}</figcaption>
          </figure>
          <div>
            <div className="ab-seas-tabs" role="group" aria-label="월 선택">
              {months.map((m) => (
                <button key={m} type="button" className={m === month ? "on" : ""} aria-pressed={m === month} onClick={() => { setMonth(m); setOpenId(null); }}>
                  {m + 1}월
                </button>
              ))}
            </div>
            <ul className="ab-seas-list">
              {points.map((p) => {
                const on = p.id === active.id;
                const n = counts.get(p.id) ?? 0;
                return (
                  <li key={p.id} className={on ? "on" : ""}>
                    <button type="button" aria-expanded={on} onClick={() => setOpenId(p.id)}>
                      <span className="nm">{p.region}</span>
                      <span className={`ct${n ? " has" : ""}`}>{n ? `모집 중 ${n}개` : "가이드만 있어요"}</span>
                    </button>
                    {on && (
                      <div className="more">
                        <p>{p.oneLiner}</p>
                        <dl>
                          <dt>만나는 생물</dt><dd>{p.life.join(", ")}</dd>
                          <dt>추천 레벨</dt><dd>{p.level}</dd>
                          {p.access && (<><dt>가는 길</dt><dd>{p.access}</dd></>)}
                          {p.verified && (<><dt>수온 · 시야</dt><dd>{p.water}</dd></>)}
                        </dl>
                        <button type="button" className="go" onClick={() => onOpenDetail(p)}>자세히 보기 →</button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <button type="button" className="ab-seas-all" onClick={() => onOpenAll(month)}>{month + 1}월 바다 전체 보기</button>
          </div>
        </div>
      </div>
    </section>
  );
}

const CSS = `
.ab-seas{background:#0E4D63;color:#fff;padding-block:clamp(64px,9vw,128px);}
.ab-seas-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:clamp(28px,4vw,48px);}
.ab-lp .ab-seas h2{color:#fff;font-size:clamp(1.75rem,1.1rem + 2.4vw,2.75rem);letter-spacing:-.025em;}
.ab-seas-head p{max-width:44ch;color:#D3E6EC;}
.ab-seas-grid{display:grid;grid-template-columns:5fr 7fr;gap:clamp(24px,5vw,80px);align-items:start;}
.ab-seas-ph{position:sticky;top:12vh;margin:0;aspect-ratio:4/5;border-radius:20px;overflow:hidden;background:#0B3F52;}
.ab-seas-ph img{width:100%;height:100%;object-fit:cover;animation:abSeasIn .35s ease;}
.ab-seas-ph::after{content:"";position:absolute;inset:auto 0 0 0;height:30%;background:rgba(6,20,36,.4);}
.ab-seas-ph figcaption{position:absolute;left:18px;right:18px;bottom:16px;z-index:1;font-weight:700;}
@keyframes abSeasIn{from{opacity:0}to{opacity:1}}
.ab-seas-tabs{display:flex;gap:8px;margin-bottom:20px;}
.ab-seas-tabs button{min-height:44px;padding:0 18px;border:0;border-radius:999px;background:#0B3F52;color:#fff;font:inherit;font-weight:700;cursor:pointer;}
.ab-seas-tabs button.on{background:#fff;color:var(--navy-dark);}
.ab-seas-list{list-style:none;margin:0;padding:0;}
.ab-seas-list li{border-radius:16px;}
.ab-seas-list li.on{background:#0B3F52;}
.ab-seas-list li>button{width:100%;display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:16px 18px;border:0;background:none;color:#D3E6EC;font:inherit;text-align:left;cursor:pointer;}
.ab-seas-list .nm{font-size:1.1875rem;font-weight:700;letter-spacing:-.01em;}
.ab-seas-list li.on .nm,.ab-seas-list li>button:hover .nm{color:#fff;}
.ab-seas-list .ct{font-size:.9375rem;font-weight:700;white-space:nowrap;}
.ab-seas-list .ct.has{color:#9FE3EC;}
.ab-seas-list .more{padding:0 18px 20px;}
.ab-seas-list .more p{max-width:52ch;}
.ab-seas-list dl{display:grid;grid-template-columns:auto 1fr;gap:6px 16px;margin:12px 0 0;font-size:.9375rem;}
.ab-seas-list dt{color:#B9D3DC;font-weight:600;}
.ab-seas-list dd{margin:0;}
.ab-seas-list .go,.ab-seas-all{border:0;background:none;font:inherit;font-weight:700;color:#9FE3EC;cursor:pointer;padding:0;}
.ab-seas-list .go{margin-top:14px;}
.ab-seas-all{margin:20px 18px 0;min-height:44px;}
.ab-seas button:focus-visible{outline:2px solid #9FE3EC;outline-offset:2px;}
.ab-seas-list .go:hover,.ab-seas-all:hover{text-decoration:underline;}
@media(max-width:760px){
  .ab-seas-head{flex-direction:column;align-items:flex-start;}
  .ab-seas-grid{grid-template-columns:1fr;}
  .ab-seas-ph{top:0;aspect-ratio:auto;height:32svh;margin-inline:calc(var(--gut) * -1);border-radius:0;z-index:2;}
  .ab-seas-list li>button{padding:15px 14px;}
  .ab-seas-list .more{padding:0 14px 18px;}
}
@media (prefers-reduced-motion:reduce){.ab-seas-ph img{animation:none;}}
`;
