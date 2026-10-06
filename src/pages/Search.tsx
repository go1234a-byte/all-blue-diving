import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Bell, List, MapPin, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubscribeSheet } from "@/components/alerts/SubscribeSheet";
import { SearchAlertBanner } from "@/components/alerts/SearchAlertBanner";
import { COUNTRIES_SITES } from "@/lib/constants";
import { useRole } from "@/contexts/RoleContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TourCard } from "@/components/search/TourCard";
import { TourMapView } from "@/components/search/TourMapView";
import { FilterSidebar, DEFAULT_FILTERS, type FilterState } from "@/components/search/FilterSidebar";
import { useAppData } from "@/contexts/AppDataContext";
import { applyPlatformFee } from "@/lib/pricing";
import { monthKeyOf } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { ActivityType } from "@/types";

type SortOption = "newest" | "cheapest" | "expensive" | "rating";
type ViewMode = "list" | "map";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "최신순",
  cheapest: "가격 낮은순",
  expensive: "가격 높은순",
  rating: "평점순",
};

const SORT_OPTIONS: SortOption[] = ["newest", "cheapest", "expensive", "rating"];

const Search = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tours } = useAppData();
  // 홈 화면 검색 폼에서 넘어온 정렬/가격 범위 값이 있으면 그대로 초기값으로 사용한다.
  const [sort, setSort] = useState<SortOption>(() => {
    const fromParam = searchParams.get("sort");
    return fromParam && (SORT_OPTIONS as string[]).includes(fromParam)
      ? (fromParam as SortOption)
      : "cheapest";
  });
  const [filters, setFilters] = useState<FilterState>(() => {
    const minParam = searchParams.get("minPrice");
    const maxParam = searchParams.get("maxPrice");
    const monthsParam = searchParams.get("months");
    return {
      priceRange: [
        minParam ? Number(minParam) : DEFAULT_FILTERS.priceRange[0],
        maxParam ? Number(maxParam) : DEFAULT_FILTERS.priceRange[1],
      ],
      months: monthsParam ? monthsParam.split(",").map(Number) : [],
    };
  });
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [alertOpen, setAlertOpen] = useState(false);
  const { role, isLoggedIn } = useRole();
  const isDiver = role === "public" && isLoggedIn;

  const query = searchParams.get("q")?.trim() ?? "";
  const activitiesParam = searchParams.get("activities");
  // 검색 조건을 알림 구독 폼에 미리 채운다. 지역 키워드가 국가명과 같으면 국가도 채운다.
  const alertPrefill = {
    initialCountry: Object.keys(COUNTRIES_SITES).includes(query) ? query : undefined,
    initialMonthKeys: filters.months,
    initialActivityTypes: activitiesParam ? (activitiesParam.split(",") as ActivityType[]) : [],
  };

  const clearQuery = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("q");
    navigate(`/search?${params.toString()}`);
  };

  const filteredTours = useMemo(() => {
    const months = filters.months;
    const activities = (activitiesParam ? activitiesParam.split(",") : []) as ActivityType[];
    const q = query.toLowerCase();
    return tours
      .filter((t) => !t.adminStatus) // 관리자가 정지/보류 처리한 투어는 검색 결과에서 제외한다.
      .filter((t) => t.status === "open") // 모집 마감(최소 인원 미달로 취소된 경우 포함)된 투어는 검색 결과에서 제외한다.
      .filter(
        (t) =>
          !q ||
          t.country.toLowerCase().includes(q) ||
          t.site.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q),
      )
      .filter((t) => months.length === 0 || months.includes(monthKeyOf(t.startDate)))
      .filter((t) => activities.length === 0 || t.activityTypes.some((a) => activities.includes(a)))
      .filter((t) => {
        // 카드/상세에는 플랫폼 수수료(10%)가 포함된 가격이 보이는데, 필터는 수수료 전
        // basePrice와 비교하고 있어서 최대 가격을 걸어도 그보다 최대 10% 비싼 투어가
        // 결과에 섞여 나올 수 있었다. 표시 가격 기준으로 비교하도록 통일한다.
        const displayPrice = applyPlatformFee(t.basePrice);
        return displayPrice >= filters.priceRange[0] && displayPrice <= filters.priceRange[1];
      })
      .sort((a, b) => {
        if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sort === "cheapest") return a.basePrice - b.basePrice;
        if (sort === "expensive") return b.basePrice - a.basePrice;
        return b.rating - a.rating;
      });
  }, [tours, query, activitiesParam, filters, sort]);

  return (
    <div className="min-h-full bg-gradient-surface pb-10">
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
        <FilterSidebar filters={filters} onChange={setFilters} />

        <div className="space-y-4">
          {query && (
            <Badge variant="secondary" className="gap-1.5 pl-3 pr-1.5 py-1 text-xs font-medium">
              &quot;{query}&quot;
              <button
                type="button"
                onClick={clearQuery}
                className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-background/60"
                aria-label="검색어 지우기"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
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

          {isDiver && filteredTours.length > 0 && <SearchAlertBanner onAlert={() => setAlertOpen(true)} />}

          {filteredTours.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8" />
              <p>조건에 맞는 투어가 없습니다. 필터를 조정해보세요.</p>
              {isDiver && (
                <Button variant="outline" className="h-11 rounded-xl px-5" onClick={() => setAlertOpen(true)}>
                  이 조건으로 알림 받기
                </Button>
              )}
            </div>
          ) : viewMode === "map" ? (
            <TourMapView tours={filteredTours} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}
        </div>
      </main>
      {isDiver && <SubscribeSheet open={alertOpen} onOpenChange={setAlertOpen} prefill={alertPrefill} />}
    </div>
  );
};

export default Search;
