import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminHeadcountControl } from "@/components/tour/AdminHeadcountControl";
import { WishButton } from "@/components/home/WishButton";
import { isDepartureConfirmed } from "@/lib/tourLabels";
import { applyPlatformFee, formatKRW } from "@/lib/pricing";
import { handleImageFallback, IMAGE_PLACEHOLDER } from "@/lib/image";
import { monthKeyOf } from "@/lib/dates";
import { ACTIVITY_LABEL } from "@/lib/activityBadge";
import { dayLabelKR, groupToursByStartDate, hasSeatsFor, matchesActivity, topCountries } from "@/lib/tours";
import type { Tour } from "@/types";

export interface HomeAd {
  image: string;
  headline: string;
  sub: string;
  onClick: () => void;
}

interface Props {
  /** 모집 중인 투어(isOpenTour 통과분). */
  tours: Tour[];
  /** 검색 카드에서 고른 출발월(monthKey)과 활동. 목록이 같이 걸러진다. */
  month: number | "";
  act: "" | "scuba" | "freediving";
  /** 검색 카드의 "몇 명". 2명 이상이면 남은 자리가 그만큼 있는 투어만 보인다. */
  party?: number;
  getJoined: (tourId: string) => number;
  verifiedInstructorIds: Set<string>;
  /** 예시(샘플) 투어 판별 — 예약 불가 표시용. */
  isSample: (title: string) => boolean;
  /** 막판 자리/마감 임박/곧 출발 투어(Landing 이 계산). */
  urgent: Array<{ t: Tour; label: string }>;
  ad: HomeAd;
}

const FIRST_PAGE = 8; // 처음에 보이는 투어 수. "더 보기"로 나머지를 연다.
const AD_AFTER = 4; // 카드가 이 개수 이상 지난 뒤 날짜 묶음 사이에 광고 배너를 한 번 넣는다.

function nightsOf(t: Tour) {
  return Math.max(1, Math.round((+new Date(t.endDate) - +new Date(t.startDate)) / 86400000));
}

export function HomeTourFinder({ tours, month, act, party = 1, getJoined, verifiedInstructorIds, isSample, urgent, ad }: Props) {
  const [country, setCountry] = useState("");
  const [showAll, setShowAll] = useState(false);

  // 월·활동으로 먼저 거른 뒤, 그 안에서 나라 칩을 만든다(칩 옆 숫자가 지금 보이는 결과와 맞도록).
  const byMonthAct = useMemo(
    () =>
      tours.filter(
        (t) =>
          (month === "" || monthKeyOf(t.startDate) === month) && matchesActivity(t, act) && hasSeatsFor(t, getJoined(t.id), party),
      ),
    [tours, month, act, party, getJoined],
  );
  const chips = useMemo(() => topCountries(byMonthAct, 5), [byMonthAct]);
  const hasLiveaboard = useMemo(() => byMonthAct.some((t) => t.activityTypes.includes("liveaboard")), [byMonthAct]);

  // 고른 나라가 월·활동을 바꾼 뒤 사라지면 전체로 되돌린다.
  useEffect(() => {
    if (country && country !== "__liveaboard" && !chips.some((c) => c.country === country)) setCountry("");
    if (country === "__liveaboard" && !hasLiveaboard) setCountry("");
  }, [chips, country, hasLiveaboard]);
  useEffect(() => setShowAll(false), [month, act, country]);

  const filtered = useMemo(
    () =>
      byMonthAct.filter((t) =>
        !country ? true : country === "__liveaboard" ? t.activityTypes.includes("liveaboard") : t.country === country,
      ),
    [byMonthAct, country],
  );
  const visible = showAll ? filtered : filtered.slice(0, FIRST_PAGE);
  const groups = useMemo(() => groupToursByStartDate(visible), [visible]);

  // 카드가 AD_AFTER 개 이상 지난 첫 날짜 묶음 앞에 광고를 놓는다(목록이 그보다 짧으면 광고 없음).
  const adBeforeGroup = useMemo(() => {
    let seen = 0;
    for (let i = 0; i < groups.length; i++) {
      if (seen >= AD_AFTER) return i;
      seen += groups[i].tours.length;
    }
    return -1;
  }, [groups]);

  return (
    <section id="tours" className="hf" aria-label="모집 중인 투어">
      <style>{CSS}</style>

      <div className="hf-chips-bar">
        <div className="wrap">
          <div className="hf-chips" role="group" aria-label="지역">
            <button type="button" className={`hf-chip ${country === "" ? "on" : ""}`} onClick={() => setCountry("")}>
              전체 {byMonthAct.length}
            </button>
            {chips.map((c) => (
              <button
                key={c.country}
                type="button"
                className={`hf-chip ${country === c.country ? "on" : ""}`}
                onClick={() => setCountry(country === c.country ? "" : c.country)}
              >
                {c.country} {c.count}
              </button>
            ))}
            {hasLiveaboard && (
              <button
                type="button"
                className={`hf-chip ${country === "__liveaboard" ? "on" : ""}`}
                onClick={() => setCountry(country === "__liveaboard" ? "" : "__liveaboard")}
              >
                리브어보드
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="wrap hf-body">
        {urgent.length > 0 && month === "" && act === "" && country === "" && (
          <div className="hf-urgent">
            <h2 className="hf-h">마감 임박</h2>
            <div className="hf-urg-row">
              {urgent.map(({ t, label }) => (
                <Link key={t.id} to={`/tour/${t.id}`} className="hf-urg">
                  <img src={t.mainImageUrl || IMAGE_PLACEHOLDER} alt="" onError={handleImageFallback} loading="lazy" />
                  <div>
                    <p className="hf-urg-t">{t.title}</p>
                    <p className="hf-hot">{label}</p>
                    <p className="hf-meta">{dayLabelKR(t.startDate).replace(/ [가-힣]+요일$/, "")} 출발</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="hf-empty">
            {tours.length === 0
              ? "현재 모집중인 투어를 준비하고 있어요. 곧 새로운 일정이 열립니다."
              : "조건에 맞는 투어가 아직 없어요. 다른 월이나 지역을 골라 보세요."}
          </p>
        ) : (
          groups.map((g, gi) => (
            <Fragment key={g.date}>
            {/* 광고는 날짜 묶음 사이에 한 번 — 날짜 제목 바로 밑에 끼면 그 날짜 투어처럼 보인다. */}
            {adBeforeGroup === gi && (
              <button type="button" className="hf-ad" onClick={ad.onClick}>
                <img src={ad.image} alt="" onError={handleImageFallback} loading="lazy" />
                <span className="hf-ad-tag">광고</span>
                <span className="hf-ad-body">
                  <b>{ad.headline}</b>
                  <span>{ad.sub}</span>
                </span>
              </button>
            )}
            <div className="hf-group">
              <h3 className="hf-day">
                {dayLabelKR(g.date)} <span>{g.tours.length}개</span>
              </h3>
              {g.tours.map((t) => {
                const joined = getJoined(t.id);
                const seats = Math.max(0, t.maxParticipants - joined);
                const fill = t.maxParticipants > 0 ? Math.min(100, Math.round((joined / t.maxParticipants) * 100)) : 0;
                const n = nightsOf(t);
                return (
                  <div key={t.id}>
                    <Link to={`/tour/${t.id}`} className="hf-card">
                      <img src={t.mainImageUrl || IMAGE_PLACEHOLDER} alt={t.title} onError={handleImageFallback} loading="lazy" />
                      <WishButton tourId={t.id} />
                      <div className="hf-card-body">
                        <p className="hf-badges">
                          {isSample(t.title) && <span className="hf-badge sample">예시 투어 · 예약 불가</span>}
                          {t.activityTypes.map((a) => (
                            <span key={a} className="hf-badge">{ACTIVITY_LABEL[a]}</span>
                          ))}
                          {verifiedInstructorIds.has(t.instructorId) && <span className="hf-badge verified">플랫폼 인증강사</span>}
                          {isDepartureConfirmed(t, joined) && <span className="hf-badge gold">출발확정</span>}
                        </p>
                        <h4>{t.title}</h4>
                        <p className="hf-meta">{t.country} · {t.site} · {n}박 {n + 1}일</p>
                        <p className="hf-price">{formatKRW(applyPlatformFee(t.basePrice))}~</p>
                        <div className="hf-bar" aria-hidden="true"><i style={{ width: `${fill}%` }} /></div>
                        <p className={`hf-seats ${seats === 0 ? "full" : seats <= 3 ? "few" : ""}`}>
                          {seats === 0 ? "모집 마감" : seats <= 3 ? `마감 임박 · 잔여 ${seats}석` : `${t.maxParticipants}명 중 ${seats}석 남음`}
                        </p>
                        <AdminHeadcountControl tour={t} className="mt-2" />
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
            </Fragment>
          ))
        )}

        {!showAll && filtered.length > FIRST_PAGE && (
          <button type="button" className="hf-more" onClick={() => setShowAll(true)}>
            투어 {filtered.length - FIRST_PAGE}개 더 보기
          </button>
        )}
        <Link to="/search" className="hf-all">전체 투어 검색 →</Link>
      </div>
    </section>
  );
}

const CSS = `
.hf{background:var(--bg-soft);padding-bottom:var(--s6);}
.hf-chips-bar{position:sticky;top:56px;z-index:40;background:var(--bg);border-bottom:1px solid var(--line);}
.hf-chips{display:flex;gap:8px;overflow-x:auto;padding:12px 0;scrollbar-width:none;}
.hf-chips::-webkit-scrollbar{display:none;}
.hf-chip{flex:none;border:1px solid var(--line);background:var(--bg);color:var(--text-1);border-radius:999px;padding:9px 15px;font:inherit;font-size:.875rem;font-weight:600;cursor:pointer;}
.hf-chip.on{background:var(--navy-dark);border-color:var(--navy-dark);color:#fff;}
.hf-body{padding-top:var(--s4);}
.hf-h{font-size:1.25rem;margin:0 0 var(--s3);}
.hf-urg-row{display:flex;gap:12px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none;}
.hf-urg-row::-webkit-scrollbar{display:none;}
.hf-urg{flex:0 0 min(300px,82%);display:flex;gap:12px;align-items:center;background:var(--bg);border:1px solid var(--line);border-radius:14px;padding:10px;}
.hf-urg img{width:72px;height:72px;border-radius:10px;object-fit:cover;flex:none;}
.hf-urg-t{margin:0;font-size:.9375rem;font-weight:700;line-height:1.35;}
.hf-hot{margin:2px 0 0;color:#C62828;font-size:.8125rem;font-weight:700;}
.hf-meta{margin:2px 0 0;color:var(--text-2);font-size:.8125rem;}
.hf-group{margin-top:var(--s4);}
.hf-day{font-size:1.0625rem;margin:0 0 var(--s2);}
.hf-day span{font-weight:500;color:var(--text-2);font-size:.8125rem;margin-left:6px;}
.hf-card{position:relative;display:flex;gap:14px;background:var(--bg);border:1px solid var(--line);border-radius:14px;padding:12px;margin-bottom:10px;transition:box-shadow .2s;}
.hf-card:hover{box-shadow:0 10px 26px -14px rgba(10,27,46,.35);}
.hf-card img{width:112px;height:112px;border-radius:10px;object-fit:cover;flex:none;}
.hf-card-body{min-width:0;flex:1;}
.hf-card h4{margin:6px 0 2px;font-size:1rem;line-height:1.35;font-weight:700;}
.hf-badges{margin:0;display:flex;flex-wrap:wrap;gap:4px;}
.hf-badge{background:var(--turq-light);color:var(--navy);border-radius:6px;font-size:.6875rem;font-weight:700;padding:3px 7px;}
.hf-badge.verified{background:#E6F1FF;color:#0D47A1;}
.hf-badge.sample{background:#FDECEA;color:#B3261E;}
.hf-card .ab-wish{top:8px;right:8px;width:32px;height:32px;}
.hf-badge.gold{background:#FFF3D6;color:#7A5A12;}
.hf-price{margin:4px 0 0;font-size:1.0625rem;font-weight:800;}
.hf-bar{height:6px;border-radius:3px;background:var(--line);margin-top:8px;overflow:hidden;}
.hf-bar i{display:block;height:100%;background:var(--turq);}
.hf-seats{margin:4px 0 0;font-size:.8125rem;color:var(--text-2);}
.hf-seats.few{color:#C62828;font-weight:700;}
.hf-seats.full{color:var(--text-2);font-weight:700;}
.hf-ad{position:relative;display:flex;align-items:center;gap:12px;width:100%;text-align:left;border:0;cursor:pointer;background:var(--navy);color:#fff;border-radius:14px;padding:12px;margin-bottom:10px;font:inherit;}
.hf-ad img{width:64px;height:64px;border-radius:10px;object-fit:cover;flex:none;}
.hf-ad-tag{position:absolute;top:8px;right:10px;font-size:.6875rem;background:rgba(255,255,255,.18);border-radius:6px;padding:2px 7px;}
.hf-ad-body{display:flex;flex-direction:column;gap:2px;padding-right:36px;}
.hf-ad-body b{font-size:.9375rem;}
.hf-ad-body span{font-size:.8125rem;opacity:.85;}
.hf-empty{color:var(--text-2);padding:var(--s5) 0;}
.hf-more{display:block;width:100%;margin-top:var(--s3);padding:14px;border:1px solid var(--navy-dark);background:var(--bg);color:var(--navy-dark);font:inherit;font-weight:700;border-radius:12px;cursor:pointer;}
.hf-all{display:block;margin-top:var(--s3);text-align:center;color:var(--turq);font-weight:700;}
@media(min-width:900px){
  .hf-body{display:grid;grid-template-columns:1fr 1fr;gap:0 var(--s4);align-items:start;}
  .hf-urgent,.hf-empty,.hf-more,.hf-all{grid-column:1/-1;}
  .hf-group{display:contents;}
  .hf-day{grid-column:1/-1;margin-top:var(--s4);}
}
`;
