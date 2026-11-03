import { usePageMeta } from "@/hooks/usePageMeta";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, List, MapPin, Search as SearchIcon, X } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TourCard } from "@/components/search/TourCard";
import { TourCardCompact } from "@/components/search/TourCardCompact";
import { SearchChipBar } from "@/components/search/SearchChipBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { TourMapView } from "@/components/search/TourMapView";
import { FilterSidebar, DEFAULT_FILTERS, type FilterState } from "@/components/search/FilterSidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { isBeginnerFriendly, isDepartureConfirmed } from "@/lib/tourLabels";
import { isRefundableNow } from "@/lib/refund";
import { earliestStartLabel, minPriceByCountry, shortPrice } from "@/lib/tourDisplay";
import { useAppData } from "@/contexts/AppDataContext";
import { applyPlatformFee } from "@/lib/pricing";
import { monthKeyOf } from "@/lib/dates";
import { isOpenTour } from "@/lib/tours";
import { cn } from "@/lib/utils";
import type { ActivityType, Tour } from "@/types";

type SortOption = "soonest" | "newest" | "cheapest" | "expensive" | "rating";
type ViewMode = "list" | "map";

const SORT_LABELS: Record<SortOption, string> = {
  soonest: "출발일 빠른순",
  newest: "최신순",
  cheapest: "가격 낮은순",
  expensive: "가격 높은순",
  rating: "평점순",
};

const SORT_OPTIONS: SortOption[] = ["soonest", "newest", "cheapest", "expensive", "rating"];

const Search = () => {
  usePageMeta({
    title: "다이빙 투어 검색",
    description: "나라·월·활동(스쿠버/프리다이빙)별로 전 세계 다이빙 투어를 비교하고 바로 예약하세요.",
    path: "/search",
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tours, getConfirmedParticipantCount, getReviewsByTourId } = useAppData();
  const isMobile = useIsMobile();
  // 홈 화면 검색 폼에서 넘어온 정렬/가격 범위 값이 있으면 그대로 초기값으로 사용한다.
  const [sort, setSort] = useState<SortOption>(() => {
    const fromParam = searchParams.get("sort");
    return fromParam && (SORT_OPTIONS as string[]).includes(fromParam)
      ? (fromParam as SortOption)
      : "soonest";
  });
  const [filters, setFilters] = useState<FilterState>(() => {
    const minParam = searchParams.get("minPrice");
    const maxParam = searchParams.get("maxPrice");
    const monthsParam = searchParams.get("months");
    const activitiesParam = searchParams.get("activities");
    const countriesParam = searchParams.get("countries");
    return {
      ...DEFAULT_FILTERS,
      priceRange: [
        minParam ? Number(minParam) : DEFAULT_FILTERS.priceRange[0],
        maxParam ? Number(maxParam) : DEFAULT_FILTERS.priceRange[1],
      ],
      months: monthsParam ? monthsParam.split(",").map(Number) : [],
      // 홈 히어로의 스쿠버/프리다이빙 버튼에서 넘어온 값도 이제 필터 칩 상태로 보여주고 바꿀 수 있다.
      activities: activitiesParam ? (activitiesParam.split(",") as ActivityType[]) : [],
      countries: countriesParam ? countriesParam.split(",") : [],
    };
  });
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const query = searchParams.get("q")?.trim() ?? "";

  const openTours = useMemo(() => tours.filter(isOpenTour), [tours]);
  // 슬라이더 끝값 = 모집중 투어 최고가(수수료 포함)를 50만원 단위로 올림. 최소 350만원.
  const priceMax = useMemo(() => {
    const top = openTours.reduce((m, t) => Math.max(m, applyPlatformFee(t.basePrice)), 0);
    return Math.max(3500000, Math.ceil(top / 500000) * 500000);
  }, [openTours]);
  const countryOptions = useMemo(
    () => [...new Set(openTours.map((t) => t.country).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko")),
    [openTours],
  );

  const countryHints = useMemo(() => {
    const m = minPriceByCountry(openTours, applyPlatformFee);
    return Object.fromEntries(Object.entries(m).map(([c, p]) => [c, `${shortPrice(p)}~`]));
  }, [openTours]);

  const [queryDraft, setQueryDraft] = useState(query);
  const submitQuery = () => {
    const params = new URLSearchParams(searchParams);
    if (queryDraft.trim()) params.set("q", queryDraft.trim());
    else params.delete("q");
    navigate(`/search?${params.toString()}`, { replace: true });
  };

  const clearQuery = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("q");
    navigate(`/search?${params.toString()}`);
  };

  // 평점은 카드·상세와 같은 기준(공개 후기 평균)으로 맞춘다. 후기가 없으면 투어에 저장된 rating 으로.
  const ratingOf = useCallback(
    (t: Tour) => {
      const rs = getReviewsByTourId(t.id).filter((r) => r.visibility !== "instructor_only");
      return rs.length ? rs.reduce((a, r) => a + r.rating, 0) / rs.length : t.rating;
    },
    [getReviewsByTourId],
  );

  const filteredTours = useMemo(() => {
    const months = filters.months;
    const activities = filters.activities;
    const q = query.toLowerCase();
    // openTours = 관리자 정지/보류 제외 + 모집 마감(최소 인원 미달 취소 포함) 제외
    return openTours
      .filter(
        (t) =>
          !q ||
          t.country.toLowerCase().includes(q) ||
          t.site.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q),
      )
      .filter((t) => months.length === 0 || months.includes(monthKeyOf(t.startDate)))
      .filter((t) => activities.length === 0 || t.activityTypes.some((a) => activities.includes(a)))
      .filter((t) => filters.countries.length === 0 || filters.countries.includes(t.country))
      .filter(
        (t) =>
          !filters.beginnerOnly || isBeginnerFriendly(t),
      )
      .filter((t) => !filters.flightIncluded || t.inclusions.some((i) => i.includes("항공")))
      .filter((t) => !filters.confirmedOnly || isDepartureConfirmed(t, getConfirmedParticipantCount(t.id)))
      .filter((t) => !filters.refundableOnly || isRefundableNow(t.startDate))
      .filter((t) => {
        // 카드/상세에는 플랫폼 수수료(10%)가 포함된 가격이 보이는데, 필터는 수수료 전
        // basePrice와 비교하고 있어서 최대 가격을 걸어도 그보다 최대 10% 비싼 투어가
        // 결과에 섞여 나올 수 있었다. 표시 가격 기준으로 비교하도록 통일한다.
        const displayPrice = applyPlatformFee(t.basePrice);
        return displayPrice >= filters.priceRange[0] && displayPrice <= filters.priceRange[1];
      })
      .sort((a, b) => {
        if (sort === "soonest") return a.startDate.localeCompare(b.startDate);
        if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sort === "cheapest") return a.basePrice - b.basePrice;
        if (sort === "expensive") return b.basePrice - a.basePrice;
        return ratingOf(b) - ratingOf(a);
      });
  }, [openTours, query, filters, sort, getConfirmedParticipantCount, ratingOf]);

  const sortTabs: Array<{ key: SortOption; label: string; value: string }> = [
    { key: "soonest", label: "출발 빠른순", value: earliestStartLabel(filteredTours) ?? "-" },
    {
      key: "cheapest",
      label: "최저가",
      value: filteredTours.length ? shortPrice(Math.min(...filteredTours.map((t) => applyPlatformFee(t.basePrice)))) : "-",
    },
    {
      key: "rating",
      label: "평점 높은순",
      value: filteredTours.some((t) => ratingOf(t) > 0) ? `★ ${Math.max(...filteredTours.map(ratingOf)).toFixed(1)}` : "-",
    },
  ];

  return (
    <div className="min-h-full bg-gradient-surface pb-24 md:pb-10">
      <header
        className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4">
          <Link to="/" className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-semibold text-foreground">검색 결과 ({filteredTours.length})</h1>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[260px_1fr]">
        <SearchChipBar filters={filters} onChange={setFilters} priceMax={priceMax} countryOptions={countryOptions} countryHints={countryHints} />
        <FilterSidebar filters={filters} onChange={setFilters} priceMax={priceMax} countryOptions={countryOptions} countryHints={countryHints} />

        <div className="space-y-4">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              submitQuery();
            }}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"
          >
            <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={queryDraft}
              onChange={(e) => setQueryDraft(e.target.value)}
              placeholder="나라·지역·투어 이름"
              aria-label="검색어"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button type="button" onClick={() => { setQueryDraft(""); clearQuery(); }} className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-secondary" aria-label="검색어 지우기">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button type="submit" className="shrink-0 text-xs font-semibold text-primary">검색</button>
          </form>
          <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-card" role="tablist" aria-label="정렬">
            {sortTabs.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={sort === t.key}
                onClick={() => setSort(t.key)}
                className={cn("border-b-[3px] px-2 py-2.5 text-center text-xs", sort === t.key ? "border-accent text-foreground" : "border-transparent text-muted-foreground")}
              >
                {t.label}
                <b className={cn("mt-0.5 block text-sm", sort === t.key ? "text-primary" : "text-foreground")}>{t.value}</b>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex overflow-hidden rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium",
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
                )}
              >
                <List className="h-3.5 w-3.5" />
                목록
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium",
                  viewMode === "map" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
                )}
              >
                <MapPin className="h-3.5 w-3.5" />
                지도
              </button>
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SORT_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredTours.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              조건에 맞는 투어가 없습니다. 필터를 조정해보세요.
            </div>
          ) : viewMode === "map" ? (
            <TourMapView tours={filteredTours} />
          ) : (
            <div className={isMobile ? "space-y-3" : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
              {filteredTours.map((tour) =>
                isMobile ? <TourCardCompact key={tour.id} tour={tour} /> : <TourCard key={tour.id} tour={tour} />,
              )}
            </div>
          )}
        </div>
      </main>
      {/* 검색 화면에서도 하단 탭바 유지 — 예전엔 검색으로 들어오면 탭바가 사라져 뒤로가기밖에 없었다. */}
      <BottomNav />
    </div>
  );
};

export default Search;
