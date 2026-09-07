import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppData } from "@/contexts/AppDataContext";
import { BUSINESS_INFO } from "@/lib/businessInfo";
import { applyPlatformFee, formatKRW } from "@/lib/pricing";
import { handleImageFallback, IMAGE_PLACEHOLDER } from "@/lib/image";
import { formatDateRangeKR } from "@/lib/dates";
import { ACTIVITY_LABEL } from "@/lib/activityBadge";
import { MONTH_LABELS_KR } from "@/lib/diveSeasons";
import { DIVE_POINTS, GUIDE_BY_MONTH, type DivePoint } from "@/content/divePointGuide";
import { LIVEABOARD_REGIONS, type LiveaboardRegion } from "@/content/liveaboardGuide";
import type { Tour } from "@/types";

/**
 * allbluedive.com 웹 전용 랜딩 — 비로그인 웹 방문자에게만 노출(앱/로그인 유저는 기존 Index 홈).
 * 라우팅 분기는 src/pages/Home.tsx. 자체 내비/푸터를 갖는 단일 페이지.
 *
 * 톤: 밝고 화사한 라이트 배경(#FFFFFF / #F4FAFB) 기본. 다크 네이비(#0A1B2E)는
 * 히어로 오버레이·푸터 등 전체의 10~15% 이내로만. 포인트는 터콰이즈(#17A8BD),
 * 골드(#D4AF6A)는 헤어라인·뱃지 5% 이내. 이미지는 임시 라이선스 스톡(public/landing/*).
 */

const HERO_LINES = [
  "팔라우, 만타레이와 눈을 마주치는 순간",
  "몰디브, 수면 아래로 빛이 쏟아지는 채널",
  "세부, 정어리 수백만 마리의 소용돌이 속으로",
];

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

/** 스크롤 진입 시 페이드업. 비동기로 늦게 마운트되는 .r 노드도 MutationObserver로 잡는다. */
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

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return m;
}

/**
 * 다이빙 포인트 가이드 · 리브어보드 공용 상세 뷰.
 * 데스크톱/태블릿 = 중앙 모달, 모바일 = 하단 바텀시트(스와이프 다운으로 닫힘).
 * 예약 요소(가격·CTA) 없음 — 순수 정보.
 */
function DetailSheet({
  open,
  onClose,
  title,
  subtitle,
  images,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  images: string[];
  children: ReactNode;
}) {
  const dragStart = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="ab-sheet-overlay" onClick={onClose} role="presentation">
      <div
        className="ab-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          dragStart.current = e.touches[0].clientY;
        }}
        onTouchMove={(e) => {
          if (dragStart.current == null) return;
          const dy = e.touches[0].clientY - dragStart.current;
          if (dy > 0) setDragY(dy);
        }}
        onTouchEnd={() => {
          if (dragY > 90) onClose();
          setDragY(0);
          dragStart.current = null;
        }}
      >
        <div className="ab-sheet-grip" aria-hidden="true" />
        <button className="ab-sheet-x" onClick={onClose} aria-label="닫기">✕</button>
        <div className="ab-sheet-gallery">
          {images.map((src) => (
            <img key={src} src={src} alt="" onError={handleImageFallback} />
          ))}
        </div>
        <div className="ab-sheet-body">
          <h3>{title}</h3>
          {subtitle && <p className="ab-sheet-sub">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

/** 강사·후기 공용 가로 슬라이드 캐러셀. 데스크톱 3~4 / 태블릿 2 / 모바일 1.1장 + 스와이프. */
function Carousel({ label, items }: { label: string; items: ReactNode[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const scrollByCard = (dir: 1 | -1) => {
    const row = rowRef.current;
    if (!row) return;
    const card = row.querySelector<HTMLElement>(":scope > *");
    const step = card ? card.offsetWidth + 20 : row.clientWidth * 0.8;
    row.scrollBy({ left: dir * step, behavior: "smooth" });
  };
  return (
    <div className="ab-caro">
      <div className="ab-caro-row" ref={rowRef} role="list" aria-label={label}>
        {items.map((c, i) => (
          <div className="ab-caro-item" role="listitem" key={i}>
            {c}
          </div>
        ))}
      </div>
      <div className="ab-caro-nav">
        <button type="button" aria-label="이전" onClick={() => scrollByCard(-1)}>‹</button>
        <button type="button" aria-label="다음" onClick={() => scrollByCard(1)}>›</button>
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { tours, instructors, reviews, publicProfiles, getTourById } = useAppData();
  const reduced = useReducedMotion();
  const profileName = (id: string) => publicProfiles.find((p) => p.id === id)?.name ?? "다녀온 다이버";
  const rootRef = useReveal();

  const isMobile = useIsMobile();
  const initialCount = isMobile ? 3 : 5;

  const [heroIdx, setHeroIdx] = useState(0);
  const [q, setQ] = useState("");
  const [month, setMonth] = useState<number | "">("");
  const [guideMonth, setGuideMonth] = useState(() => new Date().getMonth());
  const [guideCount, setGuideCount] = useState(initialCount); // 더보기로 늘어남
  const [lbCount, setLbCount] = useState(initialCount);
  const [detail, setDetail] = useState<
    { kind: "point"; data: DivePoint } | { kind: "region"; data: LiveaboardRegion } | null
  >(null);
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

  // 다이빙 포인트 가이드 — TOUR(예약) 데이터와 무관한 정적 콘텐츠.
  const monthPoints = useMemo(
    () =>
      (GUIDE_BY_MONTH[guideMonth] ?? [])
        .map((id) => DIVE_POINTS[id])
        .filter((p): p is DivePoint => Boolean(p)),
    [guideMonth],
  );
  useEffect(() => setGuideCount(initialCount), [guideMonth, initialCount]); // 달 바꾸면 처음 개수로

  const carouselInstructors = useMemo(() => {
    const verified = instructors.filter((i) => i.verified);
    return (verified.length >= 3 ? verified : instructors).slice(0, 12);
  }, [instructors]);

  const carouselReviews = useMemo(
    () =>
      reviews
        .filter((r) => !r.deleted && !r.reported && r.comment.trim().length > 10 && r.rating >= 4)
        .slice(0, 12),
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

  const FALLBACK_REVIEWS = [
    { key: "a", img: "/landing/turtle.jpg", who: "김서연", place: "세부 · 모알보알", quote: "첫 해외 다이빙이었는데 픽업부터 로그까지 다 챙겨주셔서 바다만 즐기면 됐어요.", meta: "AOW · 42 dives" },
    { key: "b", img: "/landing/whale.jpg", who: "이준호", place: "몰디브 · 남말레", quote: "만타 클리닝 스테이션에서 20분. 리브어보드 선택하길 정말 잘했습니다.", meta: "Rescue · 130 dives" },
    { key: "c", img: "/landing/coral.jpg", who: "정민아", place: "팔라우", quote: "강사님 평점이 왜 높은지 알겠더라고요. 브리핑이 남달랐어요.", meta: "OW · 18 dives" },
    { key: "d", img: "/landing/scuba1.jpg", who: "한지훈", place: "이집트 · 다합", quote: "블루홀 라인을 따라 내려가는 코스가 오래 기억에 남습니다.", meta: "AOW · 76 dives" },
  ];

  return (
    <div className="ab-lp" ref={rootRef}>
      <style>{CSS}</style>

      <nav className={`ab-nav ${scrollY > 40 ? "solid" : ""}`}>
        <Link to="/" className="ab-brand">ALL BLUE <span>올블루</span></Link>
        <div className="ab-nav-links">
          <a href="#guide">다이빙 가이드</a>
          <a href="#tours">투어</a>
          <a href="#instructors">강사</a>
          <Link to="/auth">로그인</Link>
          <Link to="/search" className="ab-btn sm">투어 찾기</Link>
        </div>
      </nav>

      {/* 1. HERO — 페이지에서 유일한 다크 영역(오버레이) */}
      <header className="ab-hero">
        <div className="ab-hero-media">
          <img
            src="/landing/hero.jpg"
            alt="수면 아래로 하강하는 다이버"
            style={reduced ? undefined : { transform: `translateY(${scrollY * 0.16}px) scale(1.06)` }}
          />
          <div className="ab-hero-scrim" />
        </div>
        <div className="wrap ab-hero-inner">
          <p className="ab-eyebrow light">Diving Tour Platform · Est. 2026</p>
          <h1 className="ab-hero-h">
            <span key={heroIdx} className="ab-hero-line on">{HERO_LINES[heroIdx]}</span>
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
          <a href="#guide" className="ab-scrollcue"><i />다이빙 가이드 보기</a>
        </div>
      </header>

      {/* 2. 다이빙 포인트 가이드 — 예약 데이터와 무관, 월 선택 + 더보기 + 카드 클릭 상세 */}
      <section id="guide" className="ab-sec ab-guide">
        <div className="wrap">
          <div className="ab-sec-head r">
            <div>
              <h2>이번 달, 어디로 떠날까요</h2>
              <p className="ab-sub">
                아직 목적지를 못 정했다면. 달을 골라 전 세계 유명 다이빙 포인트를 둘러보세요.
                카드를 누르면 자세한 정보가 열립니다. 예약이 아니라 “알아가는” 코너입니다.
              </p>
            </div>
            <span className="ab-tag">예시 콘텐츠 · 게시 전 확인 필요</span>
          </div>

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

          <div className="ab-big-grid">
            {monthPoints.slice(0, guideCount).map((pt) => (
              <button type="button" className="ab-bigcard r" key={pt.id} onClick={() => setDetail({ kind: "point", data: pt })}>
                <div className="ab-bigcard-img">
                  <img src={pt.image} alt={pt.region} onError={handleImageFallback} loading="lazy" />
                </div>
                <div className="ab-bigcard-body">
                  <p className="ab-bigcard-eyebrow">{MONTH_LABELS_KR[guideMonth]} 추천</p>
                  <h3>{pt.region}</h3>
                  <p className="ab-bigcard-oneliner">{pt.oneLiner}</p>
                  <p className="ab-bigcard-meta">{pt.water}</p>
                  <span className="ab-bigcard-more">자세히 보기 →</span>
                </div>
              </button>
            ))}
          </div>
          {monthPoints.length > guideCount && (
            <button type="button" className="ab-more r" onClick={() => setGuideCount((c) => c + (isMobile ? 3 : 6))}>
              더보기 ({monthPoints.length - guideCount})
            </button>
          )}
        </div>
      </section>

      {/* 3. 리브어보드 정보 — 국가별. 카드는 미리보기, 클릭 시 상세(기간·여정). 예약 CTA 없음 */}
      <section id="liveaboard" className="ab-sec ab-lb">
        <div className="wrap">
          <div className="ab-sec-head r">
            <div>
              <h2>리브어보드, 나라별로 살펴보기</h2>
              <p className="ab-sub">
                보트에서 숙식하며 여러 날에 걸쳐 이동하는 다이빙 방식입니다.
                카드를 누르면 며칠짜리 코스가 있고 어떤 포인트를 도는지 볼 수 있습니다.
              </p>
            </div>
            <span className="ab-tag">예시 콘텐츠 · 게시 전 확인 필요</span>
          </div>

          <div className="ab-big-grid">
            {LIVEABOARD_REGIONS.slice(0, lbCount).map((rg) => (
              <button type="button" className="ab-bigcard r" key={rg.id} onClick={() => setDetail({ kind: "region", data: rg })}>
                <div className="ab-bigcard-img">
                  <img src={rg.image} alt={rg.name} onError={handleImageFallback} loading="lazy" />
                </div>
                <div className="ab-bigcard-body">
                  <p className="ab-bigcard-eyebrow">리브어보드</p>
                  <h3>{rg.name}</h3>
                  <p className="ab-bigcard-oneliner">{rg.summary}</p>
                  <p className="ab-bigcard-meta">{rg.durations[0]} ~ {rg.durations[rg.durations.length - 1]}</p>
                  <span className="ab-bigcard-more">기간·여정 보기 →</span>
                </div>
              </button>
            ))}
          </div>
          {LIVEABOARD_REGIONS.length > lbCount && (
            <button type="button" className="ab-more r" onClick={() => setLbCount((c) => c + (isMobile ? 3 : 6))}>
              더보기 ({LIVEABOARD_REGIONS.length - lbCount})
            </button>
          )}

          <div className="ab-lb-day r">
            <p className="ab-lbcard-label">선상 하루 일과 (예시)</p>
            <ol className="ab-lb-timeline">
              {LIVEABOARD_DAY.map((d) => (
                <li key={d.t}>
                  <span className="ab-lb-time">{d.t}</span>
                  <span className="ab-lb-lbl">{d.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 상세 뷰 (가이드·리브어보드 공용) */}
      <DetailSheet
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail ? (detail.kind === "point" ? detail.data.region : detail.data.name) : ""}
        subtitle={detail?.kind === "point" ? detail.data.oneLiner : detail?.data.summary}
        images={detail ? [detail.data.image, ...detail.data.gallery] : []}
      >
        {detail?.kind === "point" && (
          <>
            <p className="ab-sheet-p">{detail.data.detail}</p>
            <dl className="ab-sheet-dl">
              <div><dt>수온 · 시야</dt><dd>{detail.data.water}</dd></div>
              <div><dt>추천 레벨</dt><dd>{detail.data.level}</dd></div>
            </dl>
            <p className="ab-lbcard-label">만날 수 있는 해양생물 (예시)</p>
            <div className="ab-chips">
              {detail.data.life.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </>
        )}
        {detail?.kind === "region" && (
          <>
            <p className="ab-sheet-p">{detail.data.detail}</p>
            <p className="ab-lbcard-label">기간 옵션 (예시)</p>
            <div className="ab-chips">
              {detail.data.durations.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <p className="ab-lbcard-label">대표 여정 (예시)</p>
            <ol className="ab-sheet-route">
              {detail.data.route.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ol>
          </>
        )}
      </DetailSheet>

      {/* 4. 브랜드 인트로 */}
      <section id="story" className="ab-sec ab-intro">
        <div className="wrap ab-intro-grid">
          <div className="r">
            <p className="ab-eyebrow">What is ALL BLUE</p>
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

      {/* 5. 모집중인 투어 (실데이터) */}
      <section id="tours" className="ab-sec ab-tours">
        <div className="wrap">
          <div className="ab-sec-head r">
            <div>
              <h2>지금 모집중인 투어</h2>
              <p className="ab-sub">인증 강사가 진행하는, 예약 가능한 일정입니다.</p>
            </div>
            <Link to="/search" className="ab-textlink">전체 투어 보기 →</Link>
          </div>

          {bentoTours.length === 0 ? (
            <p className="ab-sub r">현재 모집중인 투어를 준비하고 있어요. 곧 새로운 일정이 열립니다.</p>
          ) : (
            <div className="ab-bento r">
              {bentoTours.map((t, i) => (
                <Link key={t.id} to={`/tour/${t.id}`} className={`ab-tcard ${i === 0 ? "feat" : ""}`}>
                  <div className="ab-tcard-img">
                    <img src={t.mainImageUrl || IMAGE_PLACEHOLDER} alt={t.title} onError={handleImageFallback} loading="lazy" />
                    <div className="ab-tcard-badges">
                      {t.activityTypes.map((a) => (
                        <span key={a} className="ab-chip solid">{ACTIVITY_LABEL[a]}</span>
                      ))}
                      {t.isConfirmed && <span className="ab-chip gold">출발확정</span>}
                    </div>
                  </div>
                  <div className="ab-tcard-body">
                    <p className="ab-tcard-loc">{t.country} · {t.site}</p>
                    <h3>{t.title}</h3>
                    <div className="ab-tcard-meta">
                      <span>{formatDateRangeKR(t.startDate, t.endDate)} 출발</span>
                      <span>수온 {t.waterTempC}°C</span>
                      <span>시야 ~{t.visibilityM}m</span>
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

      {/* 6. 강사 신뢰 — 슬라이드 캐러셀 */}
      <section id="instructors" className="ab-sec ab-inst">
        <div className="wrap">
          <div className="ab-sec-head r">
            <div>
              <h2>자격이 아니라, 기록으로 증명합니다</h2>
              <p className="ab-sub">
                모든 파트너 강사는 자격·경력·사고 이력·완주율을 사전 검증받습니다.
                투어가 끝나면 참가자 평가가 프로필에 그대로 쌓입니다.
              </p>
            </div>
          </div>
        </div>
        <div className="wrap r">
          <Carousel label="인증 강사" items={(carouselInstructors.length > 0
              ? carouselInstructors.map((ins) => (
                  <article className="ab-ic" key={ins.id}>
                    <div className="ab-ic-img">
                      <img
                        src={ins.avatarUrl || "/landing/instructor.jpg"}
                        alt={ins.name}
                        onError={handleImageFallback}
                        loading="lazy"
                      />
                    </div>
                    <div className="ab-ic-body">
                      <h3>{ins.name} 강사</h3>
                      <p className="ab-ic-agency">{ins.agency || "PADI"}</p>
                      <div className="ab-ic-metrics">
                        <div><b>{(ins.totalLogs ?? 0).toLocaleString()}+</b><span>누적 다이빙</span></div>
                        <div><b>{ins.experienceYears ?? "—"}년</b><span>경력</span></div>
                      </div>
                    </div>
                  </article>
                ))
              : [1, 2, 3, 4].map((k) => (
                  <article className="ab-ic" key={k}>
                    <div className="ab-ic-img">
                      <img src="/landing/instructor.jpg" alt="ALL BLUE 인증 강사" loading="lazy" />
                    </div>
                    <div className="ab-ic-body">
                      <h3>ALL BLUE 인증 강사</h3>
                      <p className="ab-ic-agency">PADI IDC Staff Instructor</p>
                      <div className="ab-ic-metrics">
                        <div><b>1,200+</b><span>누적 다이빙</span></div>
                        <div><b>7년</b><span>경력</span></div>
                      </div>
                    </div>
                  </article>
                )))}
          />
        </div>
      </section>

      {/* 7. 다녀온 다이버의 기록 — 슬라이드 캐러셀 */}
      <section className="ab-sec ab-rev">
        <div className="wrap">
          <div className="ab-sec-head r">
            <div>
              <h2>다녀온 다이버의 기록</h2>
              <p className="ab-sub">실제 참가자가 남긴 후기입니다.</p>
            </div>
          </div>
        </div>
        <div className="wrap r">
          <Carousel label="참가자 후기" items={(carouselReviews.length >= 3
              ? carouselReviews.map((rv) => {
                  const name = profileName(rv.diverId);
                  const tour = getTourById(rv.tourId);
                  const place = tour ? `${tour.country} · ${tour.site}` : "";
                  return (
                    <article className="ab-rc" key={rv.id}>
                      <img src={rv.photos?.[0] || "/landing/turtle.jpg"} alt="" onError={handleImageFallback} loading="lazy" />
                      <div className="ab-rc-body">
                        <p className="ab-stars">{"★".repeat(Math.round(rv.rating))}</p>
                        <q>{rv.comment}</q>
                        <p className="ab-rc-who">{name}{place ? ` · ${place}` : ""}</p>
                      </div>
                    </article>
                  );
                })
              : FALLBACK_REVIEWS.map((rv) => (
                  <article className="ab-rc" key={rv.key}>
                    <img src={rv.img} alt="" onError={handleImageFallback} loading="lazy" />
                    <div className="ab-rc-body">
                      <p className="ab-stars">★★★★★</p>
                      <q>{rv.quote}</q>
                      <p className="ab-rc-who">{rv.who} · {rv.place} · {rv.meta}</p>
                    </div>
                  </article>
                )))}
          />
        </div>
      </section>

      {/* 8. CTA */}
      <section className="ab-sec ab-cta">
        <div className="wrap">
          <h2>다음 다이빙을 찾을 시간입니다</h2>
          <p className="ab-sub">지금 열려 있는 투어를 둘러보고, 강사에게 바로 문의하세요.</p>
          <Link to="/search" className="ab-btn">투어 둘러보기 →</Link>
        </div>
      </section>

      {/* 9. 푸터 — 페이지의 두 번째(마지막) 다크 영역 */}
      <footer className="ab-foot">
        <div className="wrap">
          <div className="ab-foot-top">
            <Link to="/" className="ab-brand">ALL BLUE <span>올블루</span></Link>
            <div className="ab-foot-links">
              <a href="#guide">다이빙 가이드</a>
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
.ab-lp{
  --bg:#FFFFFF;--bg-soft:#F4FAFB;--navy:#14324D;--navy-dark:#0A1B2E;
  --turq:#17A8BD;--turq-light:#E4F6F8;--gold:#D4AF6A;
  --text-1:var(--navy);--text-2:rgba(20,50,77,.75);--line:rgba(20,50,77,.12);
  --fs-h1:clamp(1.75rem,4vw,3rem);--fs-h2:clamp(1.375rem,2.5vw,2rem);--fs-body:1rem;
  --lh-head:1.2;--lh-body:1.6;
  --maxw:1200px;--gut:clamp(24px,5vw,64px);
  --s2:8px;--s3:16px;--s4:24px;--s5:32px;--s6:48px;--s7:64px;
  background:var(--bg);color:var(--text-1);
  font-family:'Pretendard','Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  font-size:var(--fs-body);line-height:var(--lh-body);-webkit-font-smoothing:antialiased;overflow-x:hidden;
}
.ab-lp *{box-sizing:border-box;}
.ab-lp h1,.ab-lp h2,.ab-lp h3{font-family:'Plus Jakarta Sans','Pretendard',sans-serif;font-weight:800;line-height:var(--lh-head);letter-spacing:-.02em;margin:0;text-wrap:balance;word-break:keep-all;}
.ab-lp h2{font-size:var(--fs-h2);color:var(--text-1);}
.ab-lp a{color:inherit;text-decoration:none;}
.ab-lp img{display:block;max-width:100%;}
.wrap{max-width:var(--maxw);margin:0 auto;padding-inline:var(--gut);}
.ab-sub{margin-top:var(--s3);font-size:var(--fs-body);line-height:var(--lh-body);color:var(--text-2);max-width:68ch;}
@media(max-width:560px){.ab-lp{font-size:.9375rem;}} /* 15px, 14px 밑으로 안 내려가게 */

.ab-eyebrow{font-size:.75rem;letter-spacing:.2em;text-transform:uppercase;color:var(--turq);font-weight:700;display:flex;align-items:center;gap:12px;margin:0 0 var(--s3);}
.ab-eyebrow::before{content:"";width:28px;height:2px;background:var(--gold);}
.ab-eyebrow.light{color:#BFEFF5;}
.ab-eyebrow.light::before{background:var(--gold);}
.ab-tag{align-self:flex-start;flex:none;font-size:.6875rem;font-weight:700;letter-spacing:.02em;color:#8a6a2e;background:var(--turq-light);border:1px solid var(--gold);border-radius:999px;padding:6px 12px;white-space:nowrap;}

.ab-btn{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:.9375rem;padding:14px 26px;border-radius:8px;background:var(--turq);color:#fff;border:1px solid var(--turq);position:relative;overflow:hidden;transition:transform .18s ease,box-shadow .18s ease;box-shadow:0 6px 20px -8px rgba(23,168,189,.6);}
.ab-btn.sm{padding:9px 16px;font-size:.875rem;box-shadow:none;}
.ab-btn:hover{transform:translateY(-1px);box-shadow:0 10px 28px -8px rgba(23,168,189,.7);}
.ab-btn::after{content:"";position:absolute;left:50%;top:50%;width:0;height:0;border-radius:50%;background:rgba(255,255,255,.35);transform:translate(-50%,-50%);transition:width .55s ease,height .55s ease,opacity .6s;opacity:0;}
.ab-btn:hover::after{width:260px;height:260px;opacity:1;}

/* NAV */
.ab-nav{position:fixed;inset:0 0 auto 0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:var(--s3) var(--gut);transition:background .3s,box-shadow .3s;}
.ab-nav.solid{background:rgba(255,255,255,.9);backdrop-filter:blur(10px);box-shadow:0 1px 0 var(--line);}
.ab-brand{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.1875rem;letter-spacing:.02em;display:inline-flex;gap:8px;align-items:baseline;color:#fff;}
.ab-nav.solid .ab-brand{color:var(--navy);}
.ab-brand span{font-size:.625rem;letter-spacing:.24em;color:currentColor;opacity:.7;text-transform:uppercase;font-weight:600;}
.ab-nav-links{display:flex;align-items:center;gap:var(--s4);}
.ab-nav-links a{font-size:.875rem;color:#fff;font-weight:600;}
.ab-nav.solid .ab-nav-links a{color:var(--navy);}
.ab-nav-links a.ab-btn{color:#fff;}
@media(max-width:820px){.ab-nav-links a:not(.ab-btn){display:none;}}

/* HERO */
.ab-hero{position:relative;min-height:min(88svh,760px);display:flex;align-items:flex-end;isolation:isolate;}
.ab-hero-media{position:absolute;inset:0;z-index:-1;overflow:hidden;}
.ab-hero-media img{width:100%;height:100%;object-fit:cover;filter:saturate(1.02) contrast(1.02);will-change:transform;}
.ab-hero-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,27,46,.5) 0%,rgba(10,27,46,.2) 40%,rgba(10,27,46,.72) 100%);}
.ab-hero-inner{padding-top:120px;padding-bottom:var(--s7);width:100%;color:#fff;}
.ab-hero-h{position:relative;font-size:var(--fs-h1);font-weight:800;max-width:20ch;color:#fff;}
.ab-hero-line{position:absolute;left:0;top:0;right:0;pointer-events:none;}
.ab-hero-line.on{animation:abheadline .6s cubic-bezier(.22,1,.36,1) both;}
@keyframes abheadline{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}
.ab-hero-line.ghost{position:relative;visibility:hidden;}
.ab-hero-lede{margin-top:var(--s4);max-width:52ch;color:rgba(255,255,255,.9);font-size:var(--fs-body);line-height:var(--lh-body);}
.ab-search{margin-top:var(--s5);display:flex;flex-wrap:wrap;gap:var(--s2);max-width:640px;background:rgba(255,255,255,.96);border-radius:12px;padding:var(--s2);box-shadow:0 20px 50px -20px rgba(10,27,46,.5);}
.ab-search-fld{flex:1 1 200px;min-width:0;border:0;outline:0;background:transparent;color:var(--navy);padding:12px 14px;font-size:.9375rem;font-family:inherit;}
.ab-search-fld::placeholder{color:var(--text-2);}
.ab-search-sel{flex:0 1 140px;appearance:none;cursor:pointer;border-left:1px solid var(--line);border-radius:0;}
.ab-search-go{border:0;cursor:pointer;background:var(--turq);color:#fff;font-weight:700;font-size:.9375rem;padding:0 24px;border-radius:8px;font-family:inherit;}
.ab-search-go:hover{background:#128ea1;}
.ab-scrollcue{margin-top:var(--s6);display:inline-flex;align-items:center;gap:12px;font-size:.6875rem;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.85);font-weight:600;}
.ab-scrollcue i{width:2px;height:36px;background:linear-gradient(#fff,transparent);animation:abdrop 2.4s ease-in-out infinite;transform-origin:top;}
@keyframes abdrop{0%,100%{transform:scaleY(.35);opacity:.4;}50%{transform:scaleY(1);opacity:1;}}

/* SECTION SHELL */
.ab-sec{position:relative;padding-block:clamp(var(--s6),8vw,var(--s7));}
.ab-sec-head{display:flex;justify-content:space-between;align-items:flex-start;gap:var(--s4);margin-bottom:var(--s6);}
.ab-sec-head h2{max-width:20ch;}
.ab-textlink{font-size:.9375rem;font-weight:700;color:var(--turq);white-space:nowrap;flex:none;margin-top:6px;}
.ab-textlink:hover{color:#0f8697;}
.r{opacity:0;transform:translateY(20px);transition:opacity .6s ease,transform .6s cubic-bezier(.22,1,.36,1);}
.r.in{opacity:1;transform:none;}
@media(max-width:640px){.ab-sec-head{flex-direction:column;}}

/* 2. GUIDE (light) */
.ab-guide{background:var(--bg);}
.ab-months{display:flex;gap:var(--s2);overflow-x:auto;margin:0 calc(-1*var(--gut)) var(--s5);padding:0 var(--gut) 6px;scrollbar-width:none;}
.ab-months::-webkit-scrollbar{display:none;}
.ab-months button{flex:0 0 auto;background:var(--bg-soft);border:1px solid var(--line);border-radius:8px;color:var(--text-2);font-family:inherit;font-size:.875rem;font-weight:700;padding:9px 16px;cursor:pointer;transition:.15s;}
.ab-months button:hover{color:var(--navy);border-color:var(--turq);}
.ab-months button.on{background:var(--turq);border-color:var(--turq);color:#fff;}
/* 큰 카드 그리드 (가이드 + 리브어보드 공용) — 데스크톱 2~3장/줄, 모바일 1장 */
.ab-big-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--s4);}
.ab-bigcard{display:flex;flex-direction:column;text-align:left;padding:0;border:1px solid var(--line);border-radius:16px;overflow:hidden;background:var(--bg);cursor:pointer;font:inherit;color:inherit;transition:transform .3s ease,box-shadow .3s ease;}
.ab-bigcard:hover{transform:translateY(-4px);box-shadow:0 24px 48px -24px rgba(20,50,77,.4);}
.ab-bigcard:focus-visible{outline:2px solid var(--turq);outline-offset:2px;}
.ab-bigcard-img{aspect-ratio:4/3;overflow:hidden;}
.ab-bigcard-img img{width:100%;height:100%;object-fit:cover;transition:transform 1s cubic-bezier(.2,.7,.2,1);}
.ab-bigcard:hover .ab-bigcard-img img{transform:scale(1.06);}
.ab-bigcard-body{padding:var(--s4);display:flex;flex-direction:column;gap:6px;flex:1;}
.ab-bigcard-eyebrow{font-size:.6875rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--turq);}
.ab-bigcard-body h3{font-size:1.125rem;}
.ab-bigcard-oneliner{font-size:.9375rem;line-height:1.55;color:var(--text-2);}
.ab-bigcard-meta{margin-top:auto;padding-top:8px;font-size:.8125rem;font-weight:600;color:var(--navy);}
.ab-bigcard-more{font-size:.8125rem;font-weight:700;color:var(--turq);}
.ab-more{display:block;margin:var(--s5) auto 0;padding:12px 28px;border-radius:8px;border:1px solid var(--turq);background:var(--bg);color:var(--turq);font:inherit;font-weight:700;font-size:.9375rem;cursor:pointer;transition:.15s;}
.ab-more:hover{background:var(--turq-light);}
@media(max-width:1024px){.ab-big-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:640px){.ab-big-grid{grid-template-columns:1fr;}}

/* 3. LIVEABOARD (soft bg) */
.ab-lb{background:var(--bg-soft);}
.ab-lbcard-label{margin:var(--s4) 0 8px;font-size:.6875rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);}
.ab-chips{display:flex;flex-wrap:wrap;gap:6px;}
.ab-chips span{font-size:.8125rem;font-weight:600;color:var(--navy);background:var(--turq-light);border-radius:6px;padding:6px 11px;}
.ab-lb-day{margin-top:var(--s6);background:var(--bg);border:1px solid var(--line);border-radius:16px;padding:var(--s5);}
.ab-lb-timeline{list-style:none;margin:12px 0 0;padding:0;border-left:2px solid var(--turq-light);}
.ab-lb-timeline li{position:relative;padding:0 0 var(--s3) var(--s4);}
.ab-lb-timeline li::before{content:"";position:absolute;left:-5px;top:6px;width:8px;height:8px;border-radius:50%;background:var(--turq);}
.ab-lb-timeline li:last-child{padding-bottom:0;}
.ab-lb-time{display:inline-block;min-width:52px;font-family:'Plus Jakarta Sans',monospace;font-size:.8125rem;font-weight:700;color:var(--turq);}
.ab-lb-lbl{font-size:.9375rem;color:var(--text-1);}

/* 상세 시트 (모달 / 모바일 바텀시트) */
.ab-sheet-overlay{position:fixed;inset:0;z-index:100;background:rgba(10,27,46,.5);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:var(--s4);animation:absheetfade .2s ease;}
@keyframes absheetfade{from{opacity:0;}to{opacity:1;}}
.ab-sheet{position:relative;background:var(--bg);border-radius:18px;max-width:560px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 40px 80px -20px rgba(10,27,46,.5);animation:absheetup .28s cubic-bezier(.22,1,.36,1);}
@keyframes absheetup{from{transform:translateY(20px);opacity:0;}to{transform:translateY(0);opacity:1;}}
.ab-sheet-grip{display:none;}
.ab-sheet-x{position:absolute;right:12px;top:12px;z-index:2;width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.9);color:var(--navy);font-size:.9rem;cursor:pointer;}
.ab-sheet-gallery{display:flex;gap:2px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;}
.ab-sheet-gallery::-webkit-scrollbar{display:none;}
.ab-sheet-gallery img{scroll-snap-align:start;flex:0 0 100%;aspect-ratio:16/10;object-fit:cover;}
.ab-sheet-body{padding:var(--s5);}
.ab-sheet-body h3{font-size:1.375rem;}
.ab-sheet-sub{margin-top:8px;font-size:.9375rem;color:var(--text-2);line-height:1.55;}
.ab-sheet-p{margin-top:var(--s4);font-size:.9375rem;line-height:1.7;color:var(--text-1);}
.ab-sheet-dl{margin:var(--s4) 0 0;display:grid;grid-template-columns:1fr 1fr;gap:var(--s3);}
.ab-sheet-dl dt{font-size:.6875rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-2);}
.ab-sheet-dl dd{margin:4px 0 0;font-size:.875rem;font-weight:600;color:var(--navy);}
.ab-sheet-route{margin:8px 0 0;padding-left:20px;font-size:.9375rem;line-height:1.9;color:var(--text-1);}
@media(max-width:640px){
  .ab-sheet-overlay{align-items:flex-end;padding:0;}
  .ab-sheet{max-width:none;border-radius:20px 20px 0 0;max-height:92vh;animation:absheetslide .3s cubic-bezier(.22,1,.36,1);}
  @keyframes absheetslide{from{transform:translateY(100%);}to{transform:translateY(0);}}
  .ab-sheet-grip{display:block;width:40px;height:4px;border-radius:2px;background:var(--line);margin:10px auto 0;}
}

/* 4. INTRO */
.ab-intro{background:var(--bg);}
.ab-intro-grid{display:grid;grid-template-columns:1.4fr .9fr;gap:var(--s7);align-items:center;}
.ab-intro blockquote{margin:0;font-family:'Plus Jakarta Sans','Pretendard',sans-serif;font-weight:700;font-size:clamp(1.25rem,2.4vw,1.875rem);line-height:1.4;letter-spacing:-.01em;color:var(--text-1);}
.ab-intro blockquote em{color:var(--turq);font-style:normal;}
.ab-intro-by{margin-top:var(--s4);font-size:.875rem;color:var(--text-2);}
.ab-stats{display:flex;flex-direction:column;border-top:2px solid var(--turq-light);}
.ab-stat{padding:var(--s4) 0;border-bottom:2px solid var(--turq-light);display:flex;align-items:baseline;justify-content:space-between;gap:var(--s3);}
.ab-stat b{font-family:'Plus Jakarta Sans',sans-serif;font-size:clamp(1.75rem,3.4vw,2.5rem);font-weight:800;color:var(--turq);font-variant-numeric:tabular-nums;line-height:1;}
.ab-stat span{font-size:.8125rem;color:var(--text-2);text-align:right;max-width:13ch;}
@media(max-width:820px){.ab-intro-grid{grid-template-columns:1fr;gap:var(--s5);}}

/* 5. TOURS */
.ab-tours{background:var(--bg-soft);}
.ab-bento{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--s4);}
.ab-tcard{background:var(--bg);border:1px solid var(--line);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;transition:transform .3s ease,box-shadow .3s ease;}
.ab-tcard:hover{transform:translateY(-4px);box-shadow:0 20px 40px -22px rgba(20,50,77,.35);}
.ab-tcard-img{position:relative;aspect-ratio:16/10;overflow:hidden;}
.ab-tcard.feat{grid-column:span 2;}
.ab-tcard.feat .ab-tcard-img{aspect-ratio:16/9;}
.ab-tcard-img img{width:100%;height:100%;object-fit:cover;transition:transform 1s cubic-bezier(.2,.7,.2,1);}
.ab-tcard:hover .ab-tcard-img img{transform:scale(1.06);}
.ab-tcard-badges{position:absolute;left:12px;top:12px;display:flex;flex-wrap:wrap;gap:6px;}
.ab-chip{font-size:.625rem;font-weight:700;letter-spacing:.03em;padding:5px 9px;border-radius:6px;background:rgba(255,255,255,.92);color:var(--navy);}
.ab-chip.solid{background:var(--turq);color:#fff;}
.ab-chip.gold{background:var(--gold);color:#3a2c10;}
.ab-tcard-body{padding:var(--s4);}
.ab-tcard-loc{font-size:.6875rem;letter-spacing:.08em;text-transform:uppercase;color:var(--text-2);font-weight:600;}
.ab-tcard-body h3{margin-top:6px;font-size:1.0625rem;}
.ab-tcard.feat .ab-tcard-body h3{font-size:1.25rem;}
.ab-tcard-meta{margin-top:10px;display:flex;flex-wrap:wrap;gap:6px 14px;font-size:.8125rem;color:var(--text-2);}
.ab-tcard-price{margin-top:12px;font-weight:800;color:var(--turq);font-size:1rem;}
@media(max-width:900px){.ab-bento{grid-template-columns:repeat(2,1fr);}.ab-tcard.feat{grid-column:span 2;}}
@media(max-width:560px){.ab-bento{grid-template-columns:1fr;}.ab-tcard.feat{grid-column:span 1;}}

/* CAROUSEL (shared: 강사 + 후기) */
.ab-caro{position:relative;}
.ab-caro-row{display:flex;gap:20px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:var(--s3);margin-inline:calc(-1*var(--gut));padding-inline:var(--gut);scrollbar-width:none;}
.ab-caro-row::-webkit-scrollbar{display:none;}
.ab-caro-item{scroll-snap-align:start;flex:0 0 calc((100% - 60px)/4);}
@media(max-width:1024px){.ab-caro-item{flex-basis:calc((100% - 20px)/2);}}
@media(max-width:640px){.ab-caro-item{flex-basis:82%;}}
.ab-caro-nav{position:absolute;right:0;top:-52px;display:flex;gap:8px;}
.ab-caro-nav button{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:var(--bg);color:var(--navy);font-size:1.25rem;line-height:1;cursor:pointer;transition:.15s;}
.ab-caro-nav button:hover{border-color:var(--turq);color:var(--turq);}
@media(max-width:640px){.ab-caro-nav{display:none;}}

/* 6. INSTRUCTORS */
.ab-inst{background:var(--bg);}
.ab-ic{background:var(--bg);border:1px solid var(--line);border-radius:14px;overflow:hidden;height:100%;}
.ab-ic-img{aspect-ratio:4/5;overflow:hidden;}
.ab-ic-img img{width:100%;height:100%;object-fit:cover;}
.ab-ic-body{padding:var(--s4);}
.ab-ic-body h3{font-size:1rem;}
.ab-ic-agency{margin-top:4px;font-size:.8125rem;color:var(--text-2);}
.ab-ic-metrics{margin-top:var(--s3);display:flex;gap:var(--s4);}
.ab-ic-metrics b{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:1.25rem;font-weight:800;color:var(--turq);}
.ab-ic-metrics span{font-size:.6875rem;color:var(--text-2);}

/* 7. REVIEWS */
.ab-rev{background:var(--bg-soft);}
.ab-rc{background:var(--bg);border:1px solid var(--line);border-radius:14px;overflow:hidden;height:100%;}
.ab-rc img{width:100%;height:150px;object-fit:cover;}
.ab-rc-body{padding:var(--s4);}
.ab-stars{margin:0;color:var(--gold);letter-spacing:.16em;font-size:.8125rem;}
.ab-rc q{display:block;margin-top:10px;font-family:'Plus Jakarta Sans','Pretendard',sans-serif;font-weight:600;font-size:.9375rem;line-height:1.5;color:var(--text-1);}
.ab-rc-who{margin-top:12px;font-size:.75rem;color:var(--text-2);}

/* 8. CTA */
.ab-cta{background:var(--turq-light);text-align:center;}
.ab-cta h2{max-width:20ch;margin-inline:auto;}
.ab-cta .ab-sub{margin-inline:auto;text-align:center;}
.ab-cta .ab-btn{margin-top:var(--s5);}

/* 9. FOOTER — 다크 */
.ab-foot{background:var(--navy-dark);color:rgba(255,255,255,.72);padding-block:var(--s7) var(--s5);}
.ab-foot .ab-brand{color:#fff;}
.ab-foot-top{display:flex;justify-content:space-between;flex-wrap:wrap;gap:var(--s4);align-items:flex-start;}
.ab-foot-links{display:flex;flex-wrap:wrap;gap:var(--s4);font-size:.8125rem;}
.ab-foot-links a:hover{color:#fff;}
.ab-bizinfo{margin-top:var(--s5);padding-top:var(--s4);border-top:1px solid rgba(255,255,255,.14);font-size:.72rem;line-height:1.9;max-width:74ch;}
.ab-pol{margin-top:10px;display:flex;gap:14px;}
.ab-pol a{text-decoration:underline;text-underline-offset:3px;}

@media(prefers-reduced-motion:reduce){
  .ab-lp *{animation-duration:.001ms!important;transition-duration:.001ms!important;}
  .r{opacity:1;transform:none;}
}
`;
