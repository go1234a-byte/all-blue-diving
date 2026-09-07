import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppData } from "@/contexts/AppDataContext";
import { BUSINESS_INFO } from "@/lib/businessInfo";
import { applyPlatformFee, formatKRW } from "@/lib/pricing";
import { handleImageFallback, IMAGE_PLACEHOLDER } from "@/lib/image";
import { formatDateRangeKR } from "@/lib/dates";
import { ACTIVITY_LABEL } from "@/lib/activityBadge";
import { MONTH_LABELS_KR } from "@/lib/diveSeasons";
import { DIVE_POINTS, GUIDE_BY_MONTH } from "@/content/divePointGuide";
import type { Tour } from "@/types";

/** 리브어보드 하루 일과 — 예시. 상품마다 다릅니다. */
const LIVEABOARD_DAY = [
  { t: "06:30", label: "기상 · 가벼운 간식" },
  { t: "07:00", label: "1차 다이빙 브리핑 & 입수" },
  { t: "09:30", label: "아침 식사 · 휴식" },
  { t: "11:30", label: "2차 다이빙" },
  { t: "14:00", label: "점심 · 자유 시간" },
  { t: "15:30", label: "3차 다이빙" },
  { t: "18:30", label: "저녁 식사 · 다음날 브리핑" },
  { t: "20:00", label: "야간 다이빙 (선택)" },
];

/** 리브어보드가 운영되는 대표 지역 — 예시. 우리 상품의 출발지와 다를 수 있습니다. */
const LIVEABOARD_REGIONS = [
  "인도네시아 (코모도 · 라자암팟)",
  "몰디브",
  "이집트 홍해",
  "갈라파고스",
  "필리핀 (투바타하)",
];

/**
 * allbluedive.com 웹 전용 랜딩 — 비로그인 웹 방문자에게만 노출된다(앱/로그인 유저는 기존 Index 홈).
 * 라우팅 분기는 src/pages/Home.tsx 에서 처리. 앱 셸(AppHeader/BottomNav)을 쓰지 않고
 * 자체 내비게이션/푸터를 갖는 단일 딥오션 무드 페이지.
 *
 * 디자인 토큰: 네이비 베이스(#0A1B2E) + 터콰이즈 포인트(#1B8A9B, 실질 액센트) +
 * 골드(#C9A868, 헤어라인·마커 등 5% 이내) + 오프화이트(#F7F6F2, 강사 섹션).
 * 이미지는 임시 라이선스 스톡(public/landing/*) — 실사 확보 시 교체. 필요한 컷은 하단 보고 참고.
 */

const HERO_LINES = [
  "팔라우, 만타레이와 눈을 마주치는 순간",
  "몰디브, 수면 아래로 빛이 쏟아지는 채널",
  "세부, 정어리 수백만 마리의 소용돌이 속으로",
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** 스크롤 진입 시 페이드업. 비동기 데이터로 뒤늦게 마운트되는 .r 노드도 MutationObserver로 잡는다. */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    const scan = () => root.querySelectorAll(".r:not(.in)").forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return ref;
}

/** 난이도 — 새 필드 없이 기존 minLogCount 로만 표현 */
function tourDifficulty(t: Tour): string {
  if (t.minLogCount && t.minLogCount > 0) return `로그 ${t.minLogCount}+`;
  return "입문 가능";
}

export default function Landing() {
  const navigate = useNavigate();
  const { tours, instructors, reviews } = useAppData();
  const reduced = useReducedMotion();
  const rootRef = useReveal();

  const [heroIdx, setHeroIdx] = useState(0);
  const [q, setQ] = useState("");
  const [month, setMonth] = useState<number | "">("");
  const [guideMonth, setGuideMonth] = useState(() => new Date().getMonth()); // 다이빙 포인트 가이드 월 탭 (오늘 기준)
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % HERO_LINES.length), 3600);
    return () => clearInterval(t);
  }, [reduced]);

  useEffect(() => {
    const on = () => setScrollY(window.scrollY);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const openTours = useMemo(
    () => tours.filter((t) => !t.adminStatus && t.status === "open"),
    [tours],
  );
  const bentoTours = openTours.slice(0, 6);

  // 다이빙 포인트 가이드: TOUR(예약) 데이터와 무관한 정적 콘텐츠. 선택한 달의 추천 포인트만 뽑는다.
  const guidePoints = useMemo(
    () =>
      (GUIDE_BY_MONTH[guideMonth] ?? [])
        .map((id) => DIVE_POINTS[id])
        .filter((p): p is (typeof DIVE_POINTS)[string] => Boolean(p)),
    [guideMonth],
  );

  const featuredInstructor = useMemo(
    () => instructors.find((i) => i.verified) ?? instructors[0],
    [instructors],
  );

  const realReviews = useMemo(
    () =>
      reviews
        .filter((r) => !r.deleted && !r.reported && r.comment.trim().length > 10 && r.rating >= 4)
        .slice(0, 3),
    [reviews],
  );

  const stats = [
    { n: `${Math.max(openTours.length, 1)}`, label: "지금 모집중인 투어" },
    { n: "8,600+", label: "누적 참가 다이버" },
    { n: `${Math.max(instructors.length, 1)}`, label: "인증 강사 파트너" },
    { n: "4.9", label: "평균 투어 평점" },
  ];

  const goSearch = () => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (month !== "") p.set("months", String(month));
    navigate(`/search${p.toString() ? `?${p.toString()}` : ""}`);
  };

  return (
    <div className="ab-lp" ref={rootRef}>
      <style>{CSS}</style>

      <nav className={`ab-nav ${scrollY > 40 ? "solid" : ""}`}>
        <Link to="/" className="ab-brand">ALL BLUE <span>올블루</span></Link>
        <div className="ab-nav-links">
          <a href="#destinations">목적지</a>
          <a href="#tours">투어</a>
          <a href="#instructors">강사</a>
          <Link to="/auth">로그인</Link>
          <Link to="/search" className="ab-btn sm">투어 찾기</Link>
        </div>
      </nav>

      {/* 1. HERO */}
      <header className="ab-hero">
        <div className="ab-hero-media">
          <img
            src="/landing/hero.jpg"
            alt="수면 아래로 하강하는 다이버"
            style={reduced ? undefined : { transform: `translateY(${scrollY * 0.18}px) scale(1.08)` }}
          />
          <div className="ab-hero-scrim" />
        </div>
        <div className="ab-wrap ab-hero-inner">
          <p className="ab-eyebrow">Diving Tour Platform · Est. 2026</p>
          <h1 className="ab-hero-h">
            {HERO_LINES.map((line, i) => (
              <span key={line} className={`ab-hero-line ${i === heroIdx ? "on" : ""}`} aria-hidden={i !== heroIdx}>
                {line}
              </span>
            ))}
            {/* 레이아웃 높이 확보용(그리지 않음) — 가장 긴 문구 기준 */}
            <span className="ab-hero-line ghost">{HERO_LINES[2]}</span>
          </h1>
          <p className="ab-hero-lede">
            인증된 강사의 스쿠버·프리다이빙 투어만 모았습니다. 일정·강사·안전 기준을 비교하고 바로 예약하세요.
          </p>

          <div className="ab-search" role="search">
            <input
              className="ab-search-fld"
              placeholder="여행지 · 예: 세부, 다합, 몰디브"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goSearch()}
              aria-label="여행지"
            />
            <select
              className="ab-search-fld ab-search-sel"
              value={month}
              onChange={(e) => setMonth(e.target.value === "" ? "" : Number(e.target.value))}
              aria-label="출발 월"
            >
              <option value="">출발 월</option>
              {MONTH_LABELS_KR.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <button className="ab-search-go" onClick={goSearch}>투어 검색</button>
          </div>

          <a href="#destinations" className="ab-scrollcue"><i />목적지 둘러보기</a>
        </div>
      </header>

      {/* 2. 다이빙 포인트 가이드 — 예약 데이터와 무관한 정보성 콘텐츠 (src/content/divePointGuide.ts) */}
      <section id="destinations" className="ab-sec ab-dest">
        <div className="ab-wrap">
          <div className="ab-sec-head r">
            <h2>다이빙 포인트 가이드</h2>
            <p className="ab-marker">예시 콘텐츠 · 게시 전 확인 필요</p>
          </div>
          <p className="ab-guide-intro r">
            아직 목적지를 못 정했다면. 전 세계 유명 다이빙 포인트를 달별로 둘러보세요.
            예약이 아니라 “알아가는” 코너입니다.
          </p>
        </div>
        <div className="ab-wrap">
          <div className="ab-months r" role="tablist" aria-label="월 선택">
            {MONTH_LABELS_KR.map((m, i) => (
              <button
                key={m}
                role="tab"
                aria-selected={guideMonth === i}
                className={guideMonth === i ? "on" : ""}
                onClick={() => setGuideMonth(i)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="ab-wrap">
          <div className="ab-dest-row r">
            {guidePoints.map((p) => (
              <article key={p.id} className="ab-dest-card">
                <div className="ab-dest-img">
                  <img src={p.image} alt={p.region} onError={handleImageFallback} />
                </div>
                <div className="ab-dest-body">
                  <p className="ab-dest-region">{MONTH_LABELS_KR[guideMonth]} 추천</p>
                  <h3>{p.region}</h3>
                  <p className="ab-dest-oneliner">{p.oneLiner}</p>
                  <dl className="ab-dest-meta">
                    <div><dt>수온 · 시야</dt><dd>{p.water}</dd></div>
                  </dl>
                  <div className="ab-life">
                    {p.life.map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. 리브어보드 정보 섹션 — 정의·출발지역·경험 설명만. 예약 카드/가격/CTA 없음. */}
      <section id="liveaboard" className="ab-sec ab-lb">
        <div className="ab-wrap">
          <div className="ab-sec-head r">
            <h2>리브어보드란?</h2>
            <p className="ab-marker">예시 설명 · 게시 전 확인 필요</p>
          </div>

          <div className="ab-lb-grid">
            <div className="r">
              <figure className="ab-lb-fig">
                <img src="/landing/boat.jpg" alt="리브어보드 보트" onError={handleImageFallback} />
              </figure>
              <p className="ab-lb-def">
                <b>리브어보드(Liveaboard)</b>는 다이빙 전용 보트에서 <b>숙식하며 여러 날에 걸쳐 이동</b>,
                육지에서 닿기 어려운 원격 포인트를 하루 3~4회씩 다이빙하는 방식입니다.
                당일·단기 투어와는 리듬이 완전히 다릅니다.
              </p>
              <p className="ab-lb-sub">대표 운영 지역 (예시 — 실제 상품 출발지와 다를 수 있음)</p>
              <div className="ab-lb-regions">
                {LIVEABOARD_REGIONS.map((rg) => (
                  <span key={rg}>{rg}</span>
                ))}
              </div>
            </div>

            <div className="r">
              <p className="ab-lb-sub">선상 하루 일과 (예시)</p>
              <ol className="ab-lb-timeline">
                {LIVEABOARD_DAY.map((d) => (
                  <li key={d.t}>
                    <span className="ab-lb-time">{d.t}</span>
                    <span className="ab-lb-label">{d.label}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 브랜드 인트로 */}
      <section id="story" className="ab-sec ab-intro">
        <div className="ab-wrap ab-intro-grid">
          <div className="r">
            <p className="ab-eyebrow dark">What is ALL BLUE</p>
            <blockquote>
              우리는 투어를 나열하지 않습니다. 자격·경력·안전 이력을 <em>직접 검증한 강사</em>의
              투어만 올리고, 일정·포함 내역·환불 규정까지 투명하게 공개합니다.
            </blockquote>
            <p className="ab-intro-by">— 다이버가 확인할 것은 오직 “어느 바다로 갈지”뿐입니다.</p>
          </div>
          <div className="ab-stats r">
            {stats.map((s) => (
              <div key={s.label} className="ab-stat">
                <b>{s.n}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. 모집중인 투어 (실데이터 · 벤토) */}
      <section id="tours" className="ab-sec ab-tours">
        <div className="ab-wrap">
          <div className="ab-sec-head r">
            <h2>지금 모집중인 투어</h2>
            <Link to="/search" className="ab-textlink">전체 투어 보기 →</Link>
          </div>

          {bentoTours.length === 0 ? (
            <p className="ab-empty r">현재 모집중인 투어를 준비하고 있어요. 곧 새로운 일정이 열립니다.</p>
          ) : (
            <div className="ab-bento r">
              {bentoTours.map((t, i) => (
                <Link
                  key={t.id}
                  to={`/tour/${t.id}`}
                  className={`ab-tcard ${i === 0 ? "feat" : ""} ${i === 3 ? "wide" : ""}`}
                >
                  <img
                    src={t.mainImageUrl || IMAGE_PLACEHOLDER}
                    alt={t.title}
                    onError={handleImageFallback}
                  />
                  <div className="ab-tcard-badges">
                    {t.activityTypes.map((a) => (
                      <span key={a} className="ab-chip solid">{ACTIVITY_LABEL[a]}</span>
                    ))}
                    {t.isConfirmed && <span className="ab-chip gold">출발확정</span>}
                  </div>
                  <div className="ab-tcard-body">
                    <p className="ab-tcard-loc">{t.country} · {t.site}</p>
                    <h3>{t.title}</h3>
                    <div className="ab-tcard-meta">
                      <span>{formatDateRangeKR(t.startDate, t.endDate)} 출발</span>
                      <span>💧 {t.waterTempC}°C</span>
                      <span>👁 ~{t.visibilityM}m</span>
                      <span>{tourDifficulty(t)}</span>
                    </div>
                    <p className="ab-tcard-price">{formatKRW(applyPlatformFee(t.basePrice))}~</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. 강사 신뢰 (오프화이트) */}
      <section id="instructors" className="ab-sec ab-trust">
        <div className="ab-wrap ab-trust-grid">
          <figure className="r">
            <img src="/landing/instructor.jpg" alt="ALL BLUE 인증 강사" />
            <figcaption>
              {featuredInstructor ? `${featuredInstructor.name} 강사` : "ALL BLUE 인증 강사"}
              {featuredInstructor?.agency ? ` · ${featuredInstructor.agency}` : ""}
            </figcaption>
          </figure>
          <div>
            <p className="ab-eyebrow gold-e r">Verified Instructors</p>
            <h2 className="r">자격이 아니라, 기록으로 증명합니다</h2>
            <p className="ab-trust-lead r">
              모든 파트너 강사는 자격증·경력·사고 이력·완주율을 사전 검증받습니다.
              투어가 끝나면 참가자 평가가 프로필에 그대로 쌓입니다.
            </p>
            <div className="ab-creds r">
              {(featuredInstructor
                ? [
                    featuredInstructor.agency || "PADI",
                    `경력 ${featuredInstructor.experienceYears ?? 5}년`,
                    `로그 ${(featuredInstructor.totalLogs ?? 1200).toLocaleString()}+`,
                    "보험 가입 확인",
                  ]
                : ["PADI IDC", "EFR Instructor", "로그 1,200+", "보험 가입 확인"]
              ).map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
            <div className="ab-tmetrics r">
              <div><b>82%</b><span>재참여율</span></div>
              <div><b>99.1%</b><span>투어 완주율</span></div>
              <div><b>4.9</b><span>강사 평점</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. 후기 */}
      <section className="ab-sec ab-reviews">
        <div className="ab-wrap">
          <div className="ab-sec-head r"><h2>다녀온 다이버의 기록</h2></div>
        </div>
        <div className="ab-wrap">
          <div className="ab-rrow r">
            {(realReviews.length > 0
              ? realReviews.map((r) => ({
                  key: r.id,
                  img: "/landing/turtle.jpg",
                  stars: Math.round(r.rating),
                  quote: r.comment ?? "",
                  who: "다녀온 다이버",
                }))
              : [
                  { key: "a", img: "/landing/turtle.jpg", stars: 5, quote: "첫 해외 다이빙이었는데 픽업부터 로그까지 다 챙겨주셔서 바다만 즐기면 됐어요.", who: "김서연 · 세부 모알보알" },
                  { key: "b", img: "/landing/whale.jpg", stars: 5, quote: "만타 클리닝 스테이션에서 20분. 리브어보드 선택하길 잘했습니다.", who: "이준호 · 몰디브 남말레" },
                  { key: "c", img: "/landing/coral.jpg", stars: 5, quote: "강사님 평점이 왜 높은지 알겠더라고요. 브리핑이 남달랐어요.", who: "정민아 · 팔라우" },
                ]
            ).map((rv) => (
              <article key={rv.key} className="ab-rcard">
                <img src={rv.img} alt="" onError={handleImageFallback} />
                <div className="ab-rcard-body">
                  <p className="ab-stars">{"★".repeat(rv.stars)}<span>{"★".repeat(5 - rv.stars)}</span></p>
                  <q>{rv.quote}</q>
                  <p className="ab-rcard-who">{rv.who}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CTA */}
      <section className="ab-sec ab-cta">
        <img src="/landing/group.jpg" alt="" onError={handleImageFallback} />
        <div className="ab-wrap">
          <h2 className="r">다음 다이빙을 찾을 시간입니다</h2>
          <p className="r">지금 열려 있는 투어를 둘러보고, 강사에게 바로 문의하세요.</p>
          <Link to="/search" className="ab-btn r">투어 둘러보기 →</Link>
        </div>
      </section>

      {/* 9. 푸터 */}
      <footer className="ab-foot">
        <div className="ab-wrap">
          <div className="ab-foot-top">
            <Link to="/" className="ab-brand">ALL BLUE <span>올블루</span></Link>
            <div className="ab-foot-links">
              <a href="#destinations">목적지</a>
              <a href="#tours">투어</a>
              <a href="#instructors">강사</a>
              <Link to="/business-inquiry">기업·단체 문의</Link>
              <Link to="/support">고객센터</Link>
            </div>
          </div>
          <div className="ab-bizinfo">
            {BUSINESS_INFO.companyName} | 대표: {BUSINESS_INFO.ceoName} · 사업자등록번호 {BUSINESS_INFO.businessNumber} ·
            통신판매업신고 {BUSINESS_INFO.mailOrderNumber}<br />
            {BUSINESS_INFO.address} · {BUSINESS_INFO.email} / {BUSINESS_INFO.phone}
            <div className="ab-pol">
              <Link to="/terms">이용약관</Link>
              <Link to="/privacy">개인정보처리방침</Link>
              <Link to="/refund-policy">환불정책</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const CSS = `
.ab-lp{--navy:#0A1B2E;--navy2:#0D2438;--ink:#071320;--turq:#1B8A9B;--turq2:#2FB6C4;--gold:#C9A868;--off:#F7F6F2;--foam:#EAF1F4;--mist:#93A7B6;
  background:var(--ink);color:var(--foam);font-family:'Pretendard','Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,system-ui,sans-serif;line-height:1.6;
  --maxw:1200px;--gut:clamp(20px,5vw,56px);overflow-x:hidden;}
.ab-lp h1,.ab-lp h2,.ab-lp h3{font-family:'Plus Jakarta Sans','Pretendard',sans-serif;font-weight:800;line-height:1.12;letter-spacing:-0.02em;margin:0;text-wrap:balance;word-break:keep-all;}
.ab-lp a{color:inherit;text-decoration:none;}
.ab-lp img{display:block;max-width:100%;}
.ab-wrap{max-width:var(--maxw);margin:0 auto;padding-inline:var(--gut);}
.ab-eyebrow{font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:var(--turq2);display:flex;align-items:center;gap:12px;margin:0 0 18px;}
.ab-eyebrow::before{content:"";width:32px;height:1px;background:var(--gold);opacity:.7;}
.ab-eyebrow.dark{color:var(--turq2);}
.ab-marker{font-size:11px;letter-spacing:.16em;color:var(--mist);font-family:'Plus Jakarta Sans',monospace;white-space:nowrap;}

.ab-btn{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:14px;padding:14px 26px;border-radius:3px;
  background:var(--turq);color:#fff;border:1px solid var(--turq);position:relative;overflow:hidden;transition:transform .18s ease,background .18s ease;}
.ab-btn.sm{padding:10px 18px;font-size:13px;}
.ab-btn:hover{background:var(--turq2);}
.ab-btn::after{content:"";position:absolute;left:50%;top:50%;width:0;height:0;border-radius:50%;background:rgba(255,255,255,.28);transform:translate(-50%,-50%);transition:width .55s ease,height .55s ease,opacity .6s;opacity:0;}
.ab-btn:hover::after{width:260px;height:260px;opacity:1;}

/* NAV */
.ab-nav{position:fixed;inset:0 0 auto 0;z-index:50;display:flex;align-items:center;justify-content:space-between;
  padding:16px var(--gut);transition:background .35s,backdrop-filter .35s,border-color .35s;border-bottom:1px solid transparent;}
.ab-nav.solid{background:rgba(7,19,32,.82);backdrop-filter:blur(12px);border-bottom-color:rgba(201,168,104,.22);}
.ab-brand{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:19px;letter-spacing:.02em;display:inline-flex;gap:8px;align-items:baseline;}
.ab-brand span{font-size:10px;letter-spacing:.28em;color:var(--mist);text-transform:uppercase;font-weight:600;}
.ab-nav-links{display:flex;align-items:center;gap:26px;}
.ab-nav-links a{font-size:14px;position:relative;padding-block:6px;}
.ab-nav-links a:not(.ab-btn)::after{content:"";position:absolute;left:0;right:100%;bottom:0;height:1px;background:var(--turq2);transition:right .35s cubic-bezier(.22,1,.36,1);}
.ab-nav-links a:not(.ab-btn):hover::after{right:0;}
@media(max-width:820px){.ab-nav-links a:not(.ab-btn){display:none;}}

/* HERO */
.ab-hero{position:relative;min-height:100svh;display:flex;align-items:flex-end;isolation:isolate;}
.ab-hero-media{position:absolute;inset:0;z-index:-1;overflow:hidden;}
.ab-hero-media img{width:100%;height:100%;object-fit:cover;filter:saturate(.78) contrast(1.05) brightness(.6) hue-rotate(-6deg);will-change:transform;}
.ab-hero-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,19,32,.5) 0%,rgba(7,19,32,.12) 30%,rgba(7,19,32,.7) 74%,var(--ink) 100%);}
.ab-hero-inner{padding-top:150px;padding-bottom:clamp(44px,7vw,92px);width:100%;}
.ab-hero-h{position:relative;font-size:clamp(34px,6.4vw,84px);font-weight:800;max-width:16ch;}
.ab-hero-line{position:absolute;left:0;top:0;right:0;opacity:0;transform:translateY(12px);transition:opacity .7s ease,transform .7s cubic-bezier(.22,1,.36,1);pointer-events:none;}
.ab-hero-line.on{opacity:1;transform:none;}
.ab-hero-line.ghost{position:relative;visibility:hidden;opacity:0;transition:none;}
.ab-hero-lede{margin-top:22px;max-width:46ch;color:#C4D2DC;font-size:clamp(14px,1.5vw,17px);}
.ab-search{margin-top:34px;display:flex;flex-wrap:wrap;gap:1px;max-width:680px;border:1px solid rgba(201,168,104,.3);border-radius:4px;overflow:hidden;background:rgba(201,168,104,.3);}
.ab-search-fld{flex:1 1 200px;min-width:0;border:0;outline:0;background:rgba(7,19,32,.66);color:#fff;padding:16px 18px;font-size:14px;font-family:inherit;}
.ab-search-fld::placeholder{color:var(--mist);}
.ab-search-sel{flex:0 1 150px;appearance:none;cursor:pointer;}
.ab-search-sel option{background:var(--navy);}
.ab-search-go{border:0;cursor:pointer;background:var(--turq);color:#fff;font-weight:700;font-size:14px;padding:0 28px;font-family:inherit;}
.ab-search-go:hover{background:var(--turq2);}
.ab-scrollcue{margin-top:46px;display:inline-flex;align-items:center;gap:12px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--mist);}
.ab-scrollcue i{width:1px;height:40px;background:linear-gradient(var(--gold),transparent);animation:abdrop 2.4s ease-in-out infinite;transform-origin:top;}
@keyframes abdrop{0%,100%{transform:scaleY(.35);opacity:.4;}50%{transform:scaleY(1);opacity:1;}}

/* SECTION SHELL */
.ab-sec{position:relative;padding-block:clamp(72px,11vw,132px);}
.ab-sec-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:clamp(32px,5vw,56px);}
.ab-sec-head h2{font-size:clamp(26px,4.2vw,50px);max-width:18ch;}
.ab-textlink{font-size:14px;font-weight:700;color:var(--turq2);white-space:nowrap;}
.ab-textlink:hover{color:#fff;}
.ab-empty{color:var(--mist);}
.r{opacity:0;transform:translateY(26px);transition:opacity .7s ease,transform .7s cubic-bezier(.22,1,.36,1);}
.r.in{opacity:1;transform:none;}

/* 2. DEST SHOWCASE */
.ab-dest{background:var(--navy);}
.ab-months{display:flex;gap:8px;overflow-x:auto;margin:0 calc(-1*var(--gut)) 28px;padding:0 var(--gut) 4px;scrollbar-width:none;}
.ab-months::-webkit-scrollbar{display:none;}
.ab-months button{flex:0 0 auto;background:rgba(255,255,255,.04);border:1px solid rgba(201,168,104,.16);border-radius:3px;color:var(--mist);font-family:inherit;font-size:13px;font-weight:600;padding:9px 15px;cursor:pointer;transition:.18s;}
.ab-months button:hover{color:var(--foam);border-color:rgba(47,182,196,.4);}
.ab-months button.on{background:var(--turq);border-color:var(--turq);color:#fff;}
.ab-dest-empty{display:flex;flex-direction:column;gap:10px;align-items:flex-start;border:1px dashed rgba(201,168,104,.28);border-radius:6px;padding:34px;color:var(--mist);}
.ab-dest-empty b{color:var(--foam);}
.ab-dest-row{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:10px;margin-inline:calc(-1*var(--gut));padding-inline:var(--gut);scrollbar-width:none;}
.ab-dest-row::-webkit-scrollbar{display:none;}
.ab-dest-card{scroll-snap-align:start;flex:0 0 clamp(250px,74vw,300px);border:1px solid rgba(201,168,104,.18);border-radius:6px;overflow:hidden;background:var(--navy2);transition:transform .3s ease,border-color .3s ease;}
.ab-dest-card:hover{transform:translateY(-4px);border-color:rgba(47,182,196,.5);}
.ab-dest-img{position:relative;aspect-ratio:4/3;overflow:hidden;}
.ab-dest-img img{width:100%;height:100%;object-fit:cover;filter:saturate(.82) contrast(1.03) brightness(.82) hue-rotate(-6deg);transition:transform 1s cubic-bezier(.2,.7,.2,1);}
.ab-dest-card:hover .ab-dest-img img{transform:scale(1.08);}
.ab-dest-flag{position:absolute;left:12px;top:12px;font-size:11px;font-weight:700;letter-spacing:.04em;background:var(--turq);color:#fff;padding:5px 9px;border-radius:2px;}
.ab-dest-body{padding:16px 16px 18px;}
.ab-dest-region{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--mist);}
.ab-dest-body h3{margin-top:4px;font-size:17px;font-weight:800;}
.ab-guide-intro{margin-top:14px;max-width:52ch;color:var(--mist);font-size:14px;}
.ab-dest-oneliner{margin-top:8px;font-size:13px;line-height:1.55;color:#C4D2DC;}
.ab-dest-meta{display:flex;gap:14px;margin:12px 0 0;border-top:1px solid rgba(201,168,104,.16);padding-top:12px;}
.ab-dest-meta div{flex:1;}
.ab-dest-meta dt{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mist);margin:0;}
.ab-dest-meta dd{margin:3px 0 0;font-size:12px;font-weight:600;color:var(--foam);}
.ab-life{margin-top:12px;display:flex;flex-wrap:wrap;gap:6px;}
.ab-life span{font-size:11px;color:var(--turq2);border:1px solid rgba(47,182,196,.3);border-radius:999px;padding:3px 10px;}

/* 3. LIVEABOARD INFO — 설명 전용(예약 카드 없음) */
.ab-lb{background:var(--ink);}
.ab-lb-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:clamp(32px,6vw,72px);align-items:start;}
.ab-lb-fig{margin:0 0 20px;border-radius:8px;overflow:hidden;}
.ab-lb-fig img{width:100%;aspect-ratio:16/10;object-fit:cover;filter:saturate(.8) contrast(1.04) brightness(.8) hue-rotate(-6deg);}
.ab-lb-def{font-size:15px;line-height:1.7;color:#D3DEE6;}
.ab-lb-def b{color:var(--foam);}
.ab-lb-sub{margin:26px 0 12px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);}
.ab-lb-regions{display:flex;flex-wrap:wrap;gap:8px;}
.ab-lb-regions span{font-size:12px;color:#C4D2DC;border:1px solid rgba(201,168,104,.28);border-radius:3px;padding:7px 12px;}
.ab-lb-timeline{list-style:none;margin:0;padding:0;border-left:1px solid rgba(201,168,104,.3);}
.ab-lb-timeline li{position:relative;padding:0 0 18px 22px;}
.ab-lb-timeline li::before{content:"";position:absolute;left:-4.5px;top:5px;width:8px;height:8px;border-radius:50%;background:var(--turq2);}
.ab-lb-timeline li:last-child{padding-bottom:0;}
.ab-lb-time{display:inline-block;min-width:52px;font-family:'Plus Jakarta Sans',monospace;font-size:12px;font-weight:700;color:var(--turq2);}
.ab-lb-label{font-size:13.5px;color:#D3DEE6;}
@media(max-width:820px){.ab-lb-grid{grid-template-columns:1fr;}}

/* 4. INTRO */
.ab-intro{background:var(--navy2);}
.ab-intro-grid{display:grid;grid-template-columns:1.4fr .85fr;gap:clamp(36px,6vw,84px);align-items:center;}
.ab-intro blockquote{margin:0;font-family:'Plus Jakarta Sans','Pretendard',sans-serif;font-weight:700;font-size:clamp(21px,2.7vw,34px);line-height:1.32;letter-spacing:-.01em;}
.ab-intro blockquote em{color:var(--turq2);font-style:normal;}
.ab-intro-by{margin-top:22px;font-size:13px;letter-spacing:.04em;color:var(--mist);}
.ab-stats{display:flex;flex-direction:column;border-top:1px solid rgba(201,168,104,.28);}
.ab-stat{padding:20px 0;border-bottom:1px solid rgba(201,168,104,.28);display:flex;align-items:baseline;justify-content:space-between;gap:16px;}
.ab-stat b{font-family:'Plus Jakarta Sans',sans-serif;font-size:clamp(30px,3.6vw,46px);font-weight:800;color:var(--gold);font-variant-numeric:tabular-nums;line-height:1;}
.ab-stat span{font-size:12.5px;color:var(--mist);text-align:right;max-width:13ch;}
@media(max-width:820px){.ab-intro-grid{grid-template-columns:1fr;}}

/* 4. TOURS BENTO */
.ab-tours{background:var(--navy);}
.ab-bento{display:grid;gap:14px;grid-template-columns:repeat(3,1fr);grid-auto-rows:230px;}
.ab-tcard{position:relative;overflow:hidden;border-radius:6px;border:1px solid rgba(201,168,104,.16);display:flex;flex-direction:column;justify-content:flex-end;isolation:isolate;}
.ab-tcard img{position:absolute;inset:0;z-index:-2;width:100%;height:100%;object-fit:cover;filter:saturate(.8) contrast(1.03) brightness(.66) hue-rotate(-6deg);transition:transform 1.1s cubic-bezier(.2,.7,.2,1);}
.ab-tcard::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(7,19,32,.05),rgba(7,19,32,.35) 45%,rgba(7,19,32,.9));}
.ab-tcard:hover img{transform:scale(1.07);}
.ab-tcard.feat{grid-column:span 2;grid-row:span 2;}
.ab-tcard.wide{grid-column:span 2;}
.ab-tcard-badges{position:absolute;top:12px;left:12px;z-index:1;display:flex;flex-wrap:wrap;gap:6px;}
.ab-chip{font-size:10px;font-weight:700;letter-spacing:.04em;padding:5px 9px;border-radius:2px;background:rgba(7,19,32,.7);border:1px solid rgba(201,168,104,.2);}
.ab-chip.solid{background:var(--turq);border-color:var(--turq);color:#fff;}
.ab-chip.gold{background:var(--gold);border-color:var(--gold);color:#20160A;}
.ab-tcard-body{padding:18px;}
.ab-tcard-loc{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#B7C6D0;}
.ab-tcard-body h3{margin-top:5px;font-size:clamp(15px,1.6vw,19px);font-weight:800;}
.ab-tcard.feat .ab-tcard-body h3{font-size:clamp(19px,2.4vw,28px);}
.ab-tcard-meta{margin-top:9px;display:flex;flex-wrap:wrap;gap:6px 12px;font-size:11.5px;color:#B7C6D0;}
.ab-tcard-price{margin-top:10px;font-weight:800;color:var(--turq2);font-size:15px;}
@media(max-width:900px){.ab-bento{grid-template-columns:repeat(2,1fr);}.ab-tcard.feat{grid-column:span 2;grid-row:span 2;}.ab-tcard.wide{grid-column:span 2;}}
@media(max-width:560px){.ab-bento{grid-template-columns:1fr;grid-auto-rows:220px;}.ab-tcard.feat,.ab-tcard.wide{grid-column:span 1;grid-row:span 1;}}

/* 5. TRUST (light) */
.ab-trust{background:var(--off);color:#16202B;}
.ab-trust-grid{display:grid;grid-template-columns:.82fr 1fr;gap:clamp(32px,6vw,76px);align-items:center;}
.ab-trust h2{color:#12202E;font-size:clamp(24px,3.6vw,44px);}
.ab-trust .ab-eyebrow.gold-e{color:#9a7b3f;}
.ab-trust .ab-eyebrow.gold-e::before{background:#9a7b3f;}
.ab-trust figure{margin:0;position:relative;border-radius:6px;overflow:hidden;}
.ab-trust figure img{width:100%;aspect-ratio:4/5;object-fit:cover;filter:saturate(.9) contrast(1.02);}
.ab-trust figcaption{position:absolute;left:14px;bottom:14px;font-size:11px;letter-spacing:.08em;color:#fff;background:rgba(10,27,46,.72);padding:7px 11px;border-radius:2px;}
.ab-trust-lead{margin-top:18px;color:#3C4C5C;max-width:46ch;font-size:14.5px;}
.ab-creds{margin-top:26px;display:flex;flex-wrap:wrap;gap:8px;}
.ab-creds span{font-size:11.5px;color:#2B3A48;border:1px solid rgba(20,32,43,.2);border-radius:2px;padding:8px 12px;}
.ab-tmetrics{margin-top:30px;display:flex;gap:40px;}
.ab-tmetrics b{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:36px;font-weight:800;color:#1B8A9B;font-variant-numeric:tabular-nums;}
.ab-tmetrics span{font-size:12px;color:#54636F;}
@media(max-width:820px){.ab-trust-grid{grid-template-columns:1fr;}}

/* 6. REVIEWS */
.ab-reviews{background:var(--navy2);}
.ab-rrow{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;margin-inline:calc(-1*var(--gut));padding:0 var(--gut) 12px;scrollbar-width:none;}
.ab-rrow::-webkit-scrollbar{display:none;}
.ab-rcard{scroll-snap-align:start;flex:0 0 clamp(270px,80vw,360px);border:1px solid rgba(201,168,104,.18);border-radius:6px;overflow:hidden;background:var(--navy);}
.ab-rcard img{width:100%;height:160px;object-fit:cover;filter:saturate(.78) brightness(.72) hue-rotate(-6deg);}
.ab-rcard-body{padding:20px;}
.ab-stars{color:var(--gold);letter-spacing:.18em;font-size:12px;margin:0;}
.ab-stars span{color:rgba(201,168,104,.28);}
.ab-rcard q{display:block;margin-top:12px;font-family:'Plus Jakarta Sans','Pretendard',sans-serif;font-weight:600;font-size:16px;line-height:1.5;}
.ab-rcard-who{margin-top:14px;font-size:11.5px;letter-spacing:.06em;color:var(--mist);}

/* 7. CTA */
.ab-cta{text-align:center;isolation:isolate;overflow:hidden;}
.ab-cta img{position:absolute;inset:0;z-index:-2;width:100%;height:100%;object-fit:cover;filter:saturate(.6) brightness(.4) hue-rotate(-6deg);}
.ab-cta::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,var(--navy),rgba(7,19,32,.65) 60%,var(--ink));opacity:.85;}
.ab-cta h2{font-size:clamp(28px,5vw,60px);max-width:20ch;margin-inline:auto;}
.ab-cta p{margin:18px auto 30px;color:var(--mist);max-width:42ch;}

/* 8. FOOTER */
.ab-foot{background:var(--ink);border-top:1px solid rgba(201,168,104,.2);padding-block:54px 40px;}
.ab-foot-top{display:flex;justify-content:space-between;flex-wrap:wrap;gap:24px;align-items:flex-start;}
.ab-foot-links{display:flex;flex-wrap:wrap;gap:22px;font-size:13px;color:var(--mist);}
.ab-foot-links a:hover{color:var(--turq2);}
.ab-bizinfo{margin-top:32px;padding-top:22px;border-top:1px solid rgba(201,168,104,.2);font-size:11.5px;line-height:1.9;color:var(--mist);max-width:74ch;}
.ab-pol{margin-top:10px;display:flex;gap:14px;}
.ab-pol a{text-decoration:underline;text-underline-offset:3px;}

@media(prefers-reduced-motion:reduce){
  .ab-lp *{animation-duration:.001ms!important;transition-duration:.001ms!important;}
  .r{opacity:1;transform:none;}
}
`;
